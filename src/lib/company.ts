type MetadataRecord = Record<string, unknown>;

type CompanyUser = {
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses?: Array<{ emailAddress?: string | null }>;
  unsafeMetadata?: MetadataRecord | null;
  publicMetadata?: MetadataRecord | null;
};

function readString(
  source: MetadataRecord | null | undefined,
  key: string,
  fallback = "",
) {
  const value = source?.[key];
  return typeof value === "string" ? value : fallback;
}

function pickString(
  sources: Array<MetadataRecord | null | undefined>,
  keys: string[],
  fallback = "",
) {
  for (const key of keys) {
    for (const source of sources) {
      const value = readString(source, key);
      if (value.trim()) return value;
    }
  }

  return fallback;
}

export type CompanyProfile = {
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  siret: string;
  color: string;
  logo: string;
  iban: string;
  bic: string;
  legal: string;
  statut: string;
  assurance: string;
  cgv: string;
  googleReview: string;
};

export function getCompanyProfile(user: CompanyUser | null | undefined): CompanyProfile {
  const metadataSources = [user?.unsafeMetadata, user?.publicMetadata];
  const fallbackName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "Mon Entreprise";

  return {
    nom: pickString(metadataSources, ["companyName"], fallbackName),
    email: user?.emailAddresses?.[0]?.emailAddress || "",
    telephone: pickString(metadataSources, ["companyPhone", "telephone"]),
    adresse: pickString(metadataSources, ["companyAddress", "adresse"]),
    siret: pickString(metadataSources, ["companySiret", "siret"]),
    color: pickString(metadataSources, ["companyColor", "color"], "#0ea5e9"),
    logo: pickString(metadataSources, ["companyLogo", "logoUrl"]),
    iban: pickString(metadataSources, ["companyIban", "iban", "rib"]),
    bic: pickString(metadataSources, ["companyBic", "bic"]),
    legal: pickString(metadataSources, ["companyLegal", "legal", "mentions"]),
    statut: pickString(metadataSources, ["companyStatut", "statutJuridique"]),
    assurance: pickString(metadataSources, ["companyAssurance", "assurance"]),
    cgv: pickString(metadataSources, ["companyCgv", "cgv"]),
    googleReview: pickString(metadataSources, ["companyGoogleReview"]),
  };
}
