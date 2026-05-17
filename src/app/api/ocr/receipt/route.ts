import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse, internalServerError, jsonError } from "@/lib/http";
import { parseReceipt, type ParsedReceipt } from "@/lib/receipt-parser";

const VISION_API = "https://vision.googleapis.com/v1/images:annotate";
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6 MB (Vision accepts up to 20 MB, on garde marge)
const SUPPORTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

type VisionAnnotateResponse = {
  responses?: Array<{
    fullTextAnnotation?: { text?: string };
    textAnnotations?: Array<{ description?: string }>;
    error?: { code?: number; message?: string };
  }>;
};

type OcrResult =
  | { ok: true; parsed: ParsedReceipt }
  | { ok: false; error: string; status: number };

async function callVisionAPI(base64: string): Promise<OcrResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      error:
        "OCR indisponible : clé GOOGLE_VISION_API_KEY non configurée côté serveur.",
    };
  }

  const url = new URL(VISION_API);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
          imageContext: { languageHints: ["fr", "en"] },
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return {
      ok: false,
      status: 502,
      error: `Google Vision a renvoyé ${response.status}${body ? ` — ${body.slice(0, 200)}` : ""}`,
    };
  }

  const payload = (await response.json()) as VisionAnnotateResponse;
  const first = payload.responses?.[0];

  if (first?.error?.message) {
    return {
      ok: false,
      status: 502,
      error: `OCR refusé : ${first.error.message}`,
    };
  }

  const text =
    first?.fullTextAnnotation?.text ??
    first?.textAnnotations?.[0]?.description ??
    "";

  if (!text.trim()) {
    return {
      ok: false,
      status: 200,
      error: "Aucun texte détecté sur l'image — réessayez avec une photo nette.",
    };
  }

  return { ok: true, parsed: parseReceipt(text) };
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`ocr-receipt:${userId}`, 10, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("image");
    if (!(file instanceof File)) {
      return jsonError("Aucune image fournie", 400);
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return jsonError("Image trop volumineuse (max 6 Mo)", 413);
    }

    if (file.type && !SUPPORTED_MIME.has(file.type.toLowerCase())) {
      return jsonError(`Format non supporté (${file.type})`, 415);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const result = await callVisionAPI(base64);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(
      { parsed: result.parsed },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return internalServerError("ocr-receipt", error, "OCR ticket impossible");
  }
}
