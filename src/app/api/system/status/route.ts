import { NextResponse } from "next/server";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { getAdminRuntimeState } from "@/lib/admin-settings";
import { getAdminEmail, isAdminUser } from "@/lib/admin";
import { internalServerError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const [runtimeState, user] = await Promise.all([getAdminRuntimeState(), currentUser()]);
    let systemBanner = runtimeState.systemBanner;

    if (!systemBanner) {
      const adminEmail = getAdminEmail();
      if (adminEmail) {
        const client = await clerkClient();
        const adminUsers = await client.users.getUserList({ emailAddress: [adminEmail] });
        const legacyBanner = adminUsers.data[0]?.publicMetadata?.systemBanner;
        systemBanner = typeof legacyBanner === "string" ? legacyBanner : "";
      }
    }

    return NextResponse.json({
      systemBanner,
      maintenanceEnabled: runtimeState.maintenanceEnabled,
      maintenanceMessage: runtimeState.maintenanceMessage,
      canBypassMaintenance: isAdminUser(user),
    });
  } catch (error) {
    return internalServerError("system-status-get", error, "Impossible de récupérer l'état système");
  }
}
