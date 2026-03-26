import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";

export async function GET() {
  const user = await currentUser();

  return NextResponse.json({
    isAdmin: isAdminUser(user),
  });
}
