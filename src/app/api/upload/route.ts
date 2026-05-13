import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/http";

/**
 * Photo / asset upload endpoint backed by Vercel Blob.
 *
 * Hardening:
 * - Auth-required (existing).
 * - Per-user rate limit: 20 uploads / minute. Avoids a logged-in
 *   user looping the endpoint and racking up Vercel Blob bills or
 *   exhausting our blob storage quota.
 * - Filename allowlist (extension + length cap) so attackers cannot
 *   inject path-traversal or store binaries we don't expect.
 */

const MAX_FILENAME_LEN = 200;
const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "heic",
  "heif",
  "pdf",
]);

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0 || idx === name.length - 1) return "";
  return name.slice(idx + 1).toLowerCase();
}

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 20 uploads / minute / user — covers the most aggressive legit
  // batch upload UX (e.g. dropping a folder of photos) while
  // capping abuse.
  const rl = rateLimit(`upload:${userId}`, 20, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  if (!filename || !request.body) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  if (filename.length > MAX_FILENAME_LEN || filename.includes("/") || filename.includes("..")) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  const ext = getExtension(filename);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse("Unsupported file type", { status: 415 });
  }

  try {
    // Generate a unique path to avoid collisions
    const blobPrefix = `users/${userId}/photos`;
    const uniqueFilename = `${blobPrefix}/${Date.now()}-${filename}`;

    const blob = await put(uniqueFilename, request.body, {
      access: "public",
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Erreur Vercel Blob Upload:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
