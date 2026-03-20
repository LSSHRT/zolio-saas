export const SUPPORT_EMAIL = "contact@zolio.site";
export const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || "";

function sanitizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function getSupportHref({
  message = "Bonjour, j'ai besoin d'aide sur Zolio.",
  subject = "Support Zolio",
}: {
  message?: string;
  subject?: string;
} = {}) {
  if (!SUPPORT_WHATSAPP) {
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  }

  const phone = sanitizePhoneNumber(SUPPORT_WHATSAPP);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function isExternalSupportHref(href: string) {
  return href.startsWith("http");
}

export function getSupportLabel() {
  return SUPPORT_WHATSAPP ? "Support WhatsApp" : "Support email";
}
