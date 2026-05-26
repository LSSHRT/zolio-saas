import { NextResponse } from "next/server";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { getAdminRuntimeState } from "@/lib/admin-settings";
import { getAdminEmail, isAdminUser } from "@/lib/admin";
import { internalServerError } from "@/lib/http";

export async function GET() {
  try {
    let runtimeState = { systemBanner: "", maintenanceEnabled: false, maintenanceMessage: "" };
    try {
      runtimeState = await getAdminRuntimeState();
    } catch (err) {
      // Ignore or log database/runtime settings retrieval error
    }

    let user = null;
    try {
      user = await currentUser();
    } catch (err) {
      // Gracefully handle Clerk being unreachable or offline
    }

    let systemBanner = runtimeState.systemBanner;

    if (!systemBanner) {
      const adminEmail = getAdminEmail();
      if (adminEmail) {
        try {
          const client = await clerkClient();
          const adminUsers = await client.users.getUserList({ emailAddress: [adminEmail] });
          const legacyBanner = adminUsers.data[0]?.publicMetadata?.systemBanner;
          systemBanner = typeof legacyBanner === "string" ? legacyBanner : "";
        } catch (clerkErr) {
          // Fallback if Clerk API fails
          systemBanner = "";
        }
      }
    }

    return NextResponse.json({
      systemBanner,
      maintenanceEnabled: runtimeState.maintenanceEnabled,
      maintenanceMessage: runtimeState.maintenanceMessage,
      canBypassMaintenance: isAdminUser(user),
    });
  } catch (error) {
    // Return a safe fallback rather than crashing with an internal 500 error
    return NextResponse.json({
      systemBanner: "",
      maintenanceEnabled: false,
      maintenanceMessage: "",
      canBypassMaintenance: false,
    });
  }
}
