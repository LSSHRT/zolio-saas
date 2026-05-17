/**
 * Parser pour tickets de caisse FR (Google Vision OCR raw text).
 * Heuristiques pures — pas d'IA, pas de réseau. Retourne best-effort
 * + un score de confiance par champ pour que l'UI puisse signaler les valeurs douteuses.
 */

export type ReceiptField<T> = {
  value: T;
  confidence: "high" | "medium" | "low";
};

export type ParsedReceipt = {
  raw: string;
  fournisseur: ReceiptField<string> | null;
  date: ReceiptField<string> | null; // ISO YYYY-MM-DD
  montantTTC: ReceiptField<number> | null;
  montantTVA: ReceiptField<number> | null;
  montantHT: ReceiptField<number> | null;
};

const AMOUNT_RE = /(\d{1,5})[,.](\d{2})(?!\d)/g;
const DATE_RE = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
const TOTAL_KEYWORDS = [
  "total ttc",
  "montant ttc",
  "total a payer",
  "total à payer",
  "net a payer",
  "net à payer",
  "total",
  "ttc",
  "montant",
];
const TVA_KEYWORDS = ["total tva", "montant tva", "tva", "t.v.a", "tva 20", "tva 10", "tva 5,5", "tva 5.5", "tva 2,1", "tva 2.1"];
const HT_KEYWORDS = ["total ht", "montant ht", "ht"];
const SKIP_VENDOR_KEYWORDS = [
  "ticket",
  "facture",
  "siret",
  "siren",
  "tva",
  "rcs",
  "tel",
  "téléphone",
  "telephone",
  "merci",
  "client",
  "date",
  "heure",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function parseAmount(input: string): number | null {
  const match = input.match(/(\d{1,5})[,.](\d{2})(?!\d)/);
  if (!match) return null;
  const integer = match[1];
  const decimal = match[2];
  const value = Number.parseFloat(`${integer}.${decimal}`);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function findAmountNear(lines: string[], keywords: string[]): ReceiptField<number> | null {
  // Pass 1: keyword + amount on same line — high confidence
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    const normalized = normalize(line);
    const matched = keywords.find((kw) => normalized.includes(kw));
    if (!matched) continue;
    const value = parseAmount(line);
    if (value !== null) {
      return { value, confidence: "high" };
    }
  }

  // Pass 2: keyword on one line, amount on the next — medium confidence
  for (let i = lines.length - 2; i >= 0; i -= 1) {
    const line = lines[i];
    const normalized = normalize(line);
    const matched = keywords.find((kw) => normalized.includes(kw));
    if (!matched) continue;
    const value = parseAmount(lines[i + 1]);
    if (value !== null) {
      return { value, confidence: "medium" };
    }
  }

  return null;
}

function findFallbackTTC(text: string): ReceiptField<number> | null {
  // Largest amount in the text — low confidence fallback when no "TOTAL" keyword found.
  const matches = Array.from(text.matchAll(AMOUNT_RE));
  if (matches.length === 0) return null;
  let best = 0;
  for (const match of matches) {
    const value = Number.parseFloat(`${match[1]}.${match[2]}`);
    if (Number.isFinite(value) && value > best) {
      best = value;
    }
  }
  return best > 0 ? { value: best, confidence: "low" } : null;
}

function findDate(text: string): ReceiptField<string> | null {
  const match = text.match(DATE_RE);
  if (!match) return null;
  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  let year = Number.parseInt(match[3], 10);
  if (year < 100) {
    year = year < 50 ? 2000 + year : 1900 + year;
  }
  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    year < 2000 ||
    year > 2100
  ) {
    return null;
  }
  // Validate against the real calendar (rejects 31/02, 31/04, leap years, etc.)
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { value: iso, confidence: "high" };
}

function findFournisseur(lines: string[]): ReceiptField<string> | null {
  // Heuristic: take the first non-empty line that doesn't contain a header keyword,
  // isn't a date/amount, and has letters. Usually the merchant name is at the top.
  for (const line of lines.slice(0, 6)) {
    const trimmed = line.trim();
    if (trimmed.length < 2 || trimmed.length > 60) continue;
    if (DATE_RE.test(trimmed)) continue;
    if (/^\d/.test(trimmed)) continue;
    const normalized = normalize(trimmed);
    if (SKIP_VENDOR_KEYWORDS.some((kw) => normalized.includes(kw))) continue;
    if (!/[a-zA-Z]/.test(trimmed)) continue;
    return { value: trimmed.replace(/\s{2,}/g, " "), confidence: "medium" };
  }
  return null;
}

export function parseReceipt(rawText: string): ParsedReceipt {
  const cleaned = rawText.replace(/\r/g, "").trim();
  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const montantTTC =
    findAmountNear(lines, TOTAL_KEYWORDS) ?? findFallbackTTC(cleaned);
  const montantTVA = findAmountNear(lines, TVA_KEYWORDS);
  const montantHT = findAmountNear(lines, HT_KEYWORDS);
  const date = findDate(cleaned);
  const fournisseur = findFournisseur(lines);

  return {
    raw: cleaned,
    fournisseur,
    date,
    montantTTC,
    montantTVA,
    montantHT,
  };
}
