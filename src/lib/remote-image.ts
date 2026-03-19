import dns from "node:dns/promises";
import net from "node:net";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const FORBIDDEN_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map(Number);

  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = octets;

  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();

  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isPrivateIp(address: string) {
  const version = net.isIP(address);

  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);

  return false;
}

async function validateRemoteImageUrl(rawUrl: string) {
  const candidate = rawUrl.trim();
  if (!candidate) return null;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.username || url.password) {
    return null;
  }

  if (FORBIDDEN_HOSTS.has(url.hostname.toLowerCase()) || url.hostname.endsWith(".local")) {
    return null;
  }

  if (net.isIP(url.hostname) && isPrivateIp(url.hostname)) {
    return null;
  }

  try {
    const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
    if (!records.length || records.some((record) => isPrivateIp(record.address))) {
      return null;
    }
  } catch {
    return null;
  }

  return url.toString();
}

export async function fetchRemoteImageAsDataUrl(rawUrl: string) {
  const safeUrl = await validateRemoteImageUrl(rawUrl);
  if (!safeUrl) return null;

  try {
    const response = await fetch(safeUrl, {
      headers: { Accept: "image/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;

    const announcedSize = Number.parseInt(
      response.headers.get("content-length") || "0",
      10,
    );
    if (announcedSize > MAX_IMAGE_BYTES) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) return null;

    return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
  } catch {
    return null;
  }
}
