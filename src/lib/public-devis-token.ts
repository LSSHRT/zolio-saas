import { createHmac, timingSafeEqual } from "node:crypto";

const PUBLIC_DEVIS_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const PUBLIC_DEVIS_TOKEN_PURPOSE = "public-devis-signature";

function resolvePublicDevisSecret() {
  const secret = process.env.PUBLIC_DEVIS_LINK_SECRET || process.env.CLERK_SECRET_KEY;
  return typeof secret === "string" && secret.trim().length > 0 ? secret : undefined;
}

type PublicDevisPayload = {
  exp: number;
  numero: string;
  purpose: string;
  userId: string;
};

function getPublicDevisSecret() {
  const secret = resolvePublicDevisSecret();

  if (!secret) {
    throw new Error("PUBLIC_DEVIS_LINK_SECRET is not set");
  }

  return secret;
}

function encodePayload(payload: PublicDevisPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(serialized: string): PublicDevisPayload {
  const parsed = JSON.parse(
    Buffer.from(serialized, "base64url").toString("utf8"),
  ) as Partial<PublicDevisPayload>;

  if (
    typeof parsed.numero !== "string" ||
    typeof parsed.userId !== "string" ||
    typeof parsed.exp !== "number" ||
    parsed.purpose !== PUBLIC_DEVIS_TOKEN_PURPOSE
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    exp: parsed.exp,
    numero: parsed.numero,
    purpose: parsed.purpose,
    userId: parsed.userId,
  };
}

function signValue(value: string) {
  return createHmac("sha256", getPublicDevisSecret())
    .update(value)
    .digest("base64url");
}

export function createPublicDevisToken(numero: string, userId: string) {
  if (!resolvePublicDevisSecret()) {
    return null;
  }

  const payload: PublicDevisPayload = {
    exp: Date.now() + PUBLIC_DEVIS_TOKEN_TTL_MS,
    numero,
    purpose: PUBLIC_DEVIS_TOKEN_PURPOSE,
    userId,
  };

  const encodedPayload = encodePayload(payload);
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyPublicDevisToken(token: string, numero: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    throw new Error("Invalid token format");
  }

  const expectedSignature = signValue(encodedPayload);
  const isValid =
    signature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!isValid) {
    throw new Error("Invalid token signature");
  }

  const payload = decodePayload(encodedPayload);

  if (payload.numero !== numero) {
    throw new Error("Token numero mismatch");
  }

  if (payload.exp < Date.now()) {
    throw new Error("Token expired");
  }

  return payload;
}
