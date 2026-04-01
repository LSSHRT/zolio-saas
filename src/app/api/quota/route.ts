import { NextResponse } from "next/server";
import { getQuotaInfo } from "@/lib/quota";
import { rateLimit } from "@/lib/rate-limit";
import { internalServerError } from "@/lib/http";

export async function GET() {
  try {
    const quota = await getQuotaInfo();
    return NextResponse.json(quota);
  } catch (error) {
    return internalServerError("quota-get", error, "Impossible de récupérer le quota");
  }
}
