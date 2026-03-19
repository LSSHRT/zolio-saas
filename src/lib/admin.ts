import { currentUser } from "@clerk/nextjs/server";

type AdminCandidate = Awaited<ReturnType<typeof currentUser>>;
type AdminUser = NonNullable<AdminCandidate>;

function normalizedEmail(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

export function getAdminEmail() {
  return normalizedEmail(
    process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "",
  );
}

export function isAdminUser(user: AdminCandidate): user is AdminUser {
  if (!user) return false;

  const adminEmail = getAdminEmail();
  const userEmail = normalizedEmail(user.emailAddresses[0]?.emailAddress);
  const isAdminRole = user.publicMetadata?.isAdmin === true;

  return Boolean(isAdminRole || (adminEmail && userEmail === adminEmail));
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await currentUser();

  if (!isAdminUser(user)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
