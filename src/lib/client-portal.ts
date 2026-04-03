import { createHmac, timingSafeEqual } from "node:crypto";

function resolveClientSecret() {
  return process.env.CLIENT_PORTAL_SECRET;
}

function signValue(value: string) {
  const secret = resolveClientSecret();
  if (!secret) throw new Error("CLIENT_PORTAL_SECRET not set");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createClientPortalToken(clientEmail: string, userId: string) {
  const secret = resolveClientSecret();
  if (!secret) return null;

  const payload = {
    email: clientEmail,
    userId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 90, // 90 jours
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(encoded);
  return `${encoded}.${signature}`;
}

export function verifyClientPortalToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) throw new Error("Invalid token");

  const expected = signValue(encoded);
  const valid = signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) throw new Error("Invalid signature");

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (payload.exp < Date.now()) throw new Error("Token expired");
  return payload;
}
