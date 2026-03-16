"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateAdminSettings(formData: FormData) {
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminRole = user?.publicMetadata?.isAdmin === true;
  
  if (!user || (userEmail !== adminEmail && !isAdminRole)) {
    throw new Error("Non autorisé");
  }

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
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminRole = user?.publicMetadata?.isAdmin === true;
  
  if (!user || (userEmail !== adminEmail && !isAdminRole)) {
    throw new Error("Non autorisé");
  }

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
  const user = await currentUser();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminRole = user?.publicMetadata?.isAdmin === true;
  if (!user || (user?.emailAddresses[0]?.emailAddress !== adminEmail && !isAdminRole)) throw new Error("Non autorisé");
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
  const user = await currentUser();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminRole = user?.publicMetadata?.isAdmin === true;
  if (!user || (user?.emailAddresses[0]?.emailAddress !== adminEmail && !isAdminRole)) throw new Error("Non autorisé");
  const client = await clerkClient();
  await client.users.deleteUser(userId);
  revalidatePath('/admin');
  return { success: true };
}

export async function setSystemBanner(message: string) {
  const user = await currentUser();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminRole = user?.publicMetadata?.isAdmin === true;
  if (!user || (user?.emailAddresses[0]?.emailAddress !== adminEmail && !isAdminRole)) throw new Error("Non autorisé");
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
  const user = await currentUser();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminRole = user?.publicMetadata?.isAdmin === true;
  if (!user || (user?.emailAddresses[0]?.emailAddress !== adminEmail && !isAdminRole)) throw new Error("Non autorisé");
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
