import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { internalServerError } from "@/lib/http";

export async function GET() {
  try {
    const user = await currentUser();

    return NextResponse.json({
      isAdmin: isAdminUser(user),
    });
  } catch (error) {
    return internalServerError("admin-me", error, "Impossible de récupérer le profil");
  }
}
