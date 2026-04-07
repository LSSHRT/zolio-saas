import { Decimal } from "@/lib/prisma";

type PrestationRecord = {
  id: string;
  nom: string;
  description?: string | null;
  unite?: string | null;
  prix: Decimal | number;
  cout?: Decimal | number | null;
  stock?: number | null;
};

type PrestationInput = {
  categorie?: string | null;
  cout?: number | string | null;
  description?: string | null;
  nom: string;
  prix: number | string;
  stock?: number | string | null;
  unite?: string | null;
};

const CATEGORY_MARKER = "[[zolio-category:";
const CATEGORY_END_MARKER = "]]";

function toFloat(value: number | string | null | undefined) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toInt(value: number | string | null | undefined) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function encodePrestationDescription({
  categorie,
  description,
}: {
  categorie?: string | null;
  description?: string | null;
}) {
  const cleanCategory = normalizeText(categorie);
  const cleanDescription = normalizeText(description);

  if (!cleanCategory) {
    return cleanDescription;
  }

  return cleanDescription
    ? `${CATEGORY_MARKER}${cleanCategory}${CATEGORY_END_MARKER}\n${cleanDescription}`
    : `${CATEGORY_MARKER}${cleanCategory}${CATEGORY_END_MARKER}`;
}

export function decodePrestationDescription(description?: string | null) {
  const rawValue = normalizeText(description);
  if (!rawValue.startsWith(CATEGORY_MARKER)) {
    return {
      categorie: "Autre",
      description: rawValue,
    };
  }

  const markerIndex = rawValue.indexOf(CATEGORY_END_MARKER);
  if (markerIndex === -1) {
    return {
      categorie: "Autre",
      description: rawValue,
    };
  }

  const categorie = rawValue.slice(CATEGORY_MARKER.length, markerIndex).trim() || "Autre";
  const cleanDescription = rawValue.slice(markerIndex + CATEGORY_END_MARKER.length).trim();

  return {
    categorie,
    description: cleanDescription,
  };
}

export function mapPrestationForClient(record: PrestationRecord) {
  const decoded = decodePrestationDescription(record.description);

  return {
    id: record.id,
    categorie: decoded.categorie,
    nom: record.nom,
    description: decoded.description,
    unite: record.unite || "",
    prix: Number(record.prix),
    cout: Number(record.cout || 0),
    stock: record.stock || 0,
  };
}

export function buildPrestationCreateData(userId: string, input: PrestationInput) {
  return {
    userId,
    nom: normalizeText(input.nom),
    description: encodePrestationDescription({
      categorie: input.categorie,
      description: input.description,
    }),
    unite: normalizeText(input.unite),
    prix: toFloat(input.prix),
    cout: toFloat(input.cout),
    stock: toInt(input.stock),
  };
}
