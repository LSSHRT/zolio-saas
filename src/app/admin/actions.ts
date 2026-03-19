"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin";
import {
  ADMIN_SETTING_KEYS,
  appendAdminAuditLog,
  setAdminSettingValue,
} from "@/lib/admin-settings";

function formatAdminActor(user: Awaited<ReturnType<typeof requireAdminUser>>) {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  const email = user.emailAddresses[0]?.emailAddress || "admin@zolio.site";
  return name ? `${name} • ${email}` : email;
}

async function purgeUserWorkspaceData(userId: string) {
  await prisma.$transaction([
    prisma.devis.deleteMany({ where: { userId } }),
    prisma.facture.deleteMany({ where: { userId } }),
    prisma.depense.deleteMany({ where: { userId } }),
    prisma.note.deleteMany({ where: { userId } }),
    prisma.prestation.deleteMany({ where: { userId } }),
    prisma.client.deleteMany({ where: { userId } }),
  ]);
}

export async function markMailAsFailed(mailId: string) {
  const adminUser = await requireAdminUser();

  await prisma.prospectMail.update({
    where: { id: mailId },
    data: { status: "Failed" }
  });

  await appendAdminAuditLog({
    level: "warning",
    scope: "acquisition",
    action: "mail.mark_failed",
    actor: formatAdminActor(adminUser),
    message: "Un email de prospection a été marqué en échec.",
    meta: mailId,
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function updateAdminSettings(formData: FormData) {
  const user = await requireAdminUser();

  const geminiKey = formData.get("geminiKey")?.toString();
  
  const client = await clerkClient();
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: {
      ...user.publicMetadata,
      customGeminiKey: geminiKey || null
    }
  });

  await appendAdminAuditLog({
    level: "success",
    scope: "system",
    action: "gemini.update",
    actor: formatAdminActor(user),
    message: geminiKey
      ? "La clé Gemini admin a été définie."
      : "La surcharge Gemini admin a été supprimée.",
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function toggleUserProStatus(userId: string, isPro: boolean) {
  const adminUser = await requireAdminUser();

  const client = await clerkClient();
  const targetUser = await client.users.getUser(userId);
  
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...targetUser.publicMetadata,
      isPro: isPro,
      // Optional: Clear stripeSubscriptionId if we revoke to be clean, or keep it.
      // We'll just manage the `isPro` boolean for manual grants
    }
  });

  await appendAdminAuditLog({
    level: "success",
    scope: "billing",
    action: isPro ? "user.pro.granted" : "user.pro.revoked",
    actor: formatAdminActor(adminUser),
    message: `${targetUser.emailAddresses[0]?.emailAddress || userId} ${isPro ? "est passé PRO" : "a perdu son statut PRO"}.`,
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function banUser(userId: string, isBanned: boolean) {
  const adminUser = await requireAdminUser();
  const client = await clerkClient();
  const targetUser = await client.users.getUser(userId);
  if (isBanned) {
    await client.users.banUser(userId);
  } else {
    await client.users.unbanUser(userId);
  }
  await appendAdminAuditLog({
    level: "warning",
    scope: "security",
    action: isBanned ? "user.banned" : "user.unbanned",
    actor: formatAdminActor(adminUser),
    message: `${targetUser.emailAddresses[0]?.emailAddress || userId} ${isBanned ? "a été banni" : "a été débanni"}.`,
  });
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteUserAccount(userId: string) {
  const adminUser = await requireAdminUser();
  const client = await clerkClient();
  const targetUser = await client.users.getUser(userId);
  await purgeUserWorkspaceData(userId);
  await client.users.deleteUser(userId);
  await appendAdminAuditLog({
    level: "error",
    scope: "security",
    action: "user.deleted",
    actor: formatAdminActor(adminUser),
    message: `${targetUser.emailAddresses[0]?.emailAddress || userId} a été supprimé.`,
  });
  revalidatePath('/admin');
  return { success: true };
}

export async function setSystemBanner(message: string) {
  const user = await requireAdminUser();
  await setAdminSettingValue(ADMIN_SETTING_KEYS.systemBanner, message || "");
  await appendAdminAuditLog({
    level: "success",
    scope: "system",
    action: "banner.updated",
    actor: formatAdminActor(user),
    message: message ? "La bannière globale a été mise à jour." : "La bannière globale a été supprimée.",
    meta: message || undefined,
  });
  revalidatePath("/");
  revalidatePath('/admin');
  return { success: true };
}

export async function grantAdminRole(userId: string, isAdmin: boolean) {
  const adminUser = await requireAdminUser();
  const client = await clerkClient();
  const targetUser = await client.users.getUser(userId);
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...targetUser.publicMetadata,
      isAdmin: isAdmin
    }
  });
  await appendAdminAuditLog({
    level: "warning",
    scope: "security",
    action: isAdmin ? "user.admin.granted" : "user.admin.revoked",
    actor: formatAdminActor(adminUser),
    message: `${targetUser.emailAddresses[0]?.emailAddress || userId} ${isAdmin ? "a reçu" : "a perdu"} les droits admin.`,
  });
  revalidatePath('/admin');
  return { success: true };
}

export async function setMaintenanceMode(enabled: boolean, message: string) {
  const adminUser = await requireAdminUser();

  await Promise.all([
    setAdminSettingValue(ADMIN_SETTING_KEYS.maintenanceEnabled, enabled ? "true" : "false"),
    setAdminSettingValue(ADMIN_SETTING_KEYS.maintenanceMessage, message || ""),
  ]);

  await appendAdminAuditLog({
    level: enabled ? "warning" : "success",
    scope: "system",
    action: enabled ? "maintenance.enabled" : "maintenance.disabled",
    actor: formatAdminActor(adminUser),
    message: enabled ? "Le mode maintenance a été activé." : "Le mode maintenance a été désactivé.",
    meta: message || undefined,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}
