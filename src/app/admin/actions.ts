"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";

export async function updateAdminSettings(formData: FormData) {
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  
  if (!user || userEmail !== adminEmail) {
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
