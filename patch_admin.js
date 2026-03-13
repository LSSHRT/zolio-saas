const fs = require('fs');
const path = require('path');

const actionsPath = path.join(__dirname, 'src', 'app', 'admin', 'actions.ts');
const actionsContent = fs.readFileSync(actionsPath, 'utf8');

const newActions = `
export async function banUser(userId: string, isBanned: boolean) {
  const user = await currentUser();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!user || user?.emailAddresses[0]?.emailAddress !== adminEmail) throw new Error("Non autorisé");
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
  if (!user || user?.emailAddresses[0]?.emailAddress !== adminEmail) throw new Error("Non autorisé");
  const client = await clerkClient();
  await client.users.deleteUser(userId);
  revalidatePath('/admin');
  return { success: true };
}

export async function setSystemBanner(message: string) {
  const user = await currentUser();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!user || user?.emailAddresses[0]?.emailAddress !== adminEmail) throw new Error("Non autorisé");
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
  if (!user || user?.emailAddresses[0]?.emailAddress !== adminEmail) throw new Error("Non autorisé");
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
`;

fs.writeFileSync(actionsPath, actionsContent + newActions, 'utf8');

console.log("actions.ts updated");
