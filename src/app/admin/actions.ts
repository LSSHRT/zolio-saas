"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin";

export async function markMailAsFailed(mailId: string) {
  await requireAdminUser();

  await prisma.prospectMail.update({
    where: { id: mailId },
    data: { status: "Failed" }
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

  return { success: true };
}

export async function toggleUserProStatus(userId: string, isPro: boolean) {
  await requireAdminUser();

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

  revalidatePath('/admin');
  return { success: true };
}

export async function banUser(userId: string, isBanned: boolean) {
  await requireAdminUser();
  const client = await clerkClient();
  if (isBanned) {
    await client.users.banUser(userId);
  } else {
    await client.users.unbanUser(userId);
  }
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteUserAccount(userId: string) {
  await requireAdminUser();
  const client = await clerkClient();
  await client.users.deleteUser(userId);
  revalidatePath('/admin');
  return { success: true };
}

export async function setSystemBanner(message: string) {
  const user = await requireAdminUser();
  const client = await clerkClient();
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: {
      ...user.publicMetadata,
      systemBanner: message || null
    }
  });
  revalidatePath('/admin');
  return { success: true };
}

export async function grantAdminRole(userId: string, isAdmin: boolean) {
  await requireAdminUser();
  const client = await clerkClient();
  const targetUser = await client.users.getUser(userId);
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...targetUser.publicMetadata,
      isAdmin: isAdmin
    }
  });
  revalidatePath('/admin');
  return { success: true };
}
