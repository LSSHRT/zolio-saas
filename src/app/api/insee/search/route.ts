import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse, internalServerError } from "@/lib/http";

const INSEE_API = "https://recherche-entreprises.api.gouv.fr/search";

type SiegeApi = {
  siret?: string | null;
  adresse?: string | null;
  code_postal?: string | null;
  libelle_commune?: string | null;
  numero_voie?: string | null;
  type_voie?: string | null;
  libelle_voie?: string | null;
  est_siege?: boolean | null;
};

type ResultApi = {
  siren?: string | null;
  nom_complet?: string | null;
  nom_raison_sociale?: string | null;
  activite_principale?: string | null;
  etat_administratif?: string | null;
  siege?: SiegeApi | null;
};

type InseeResponse = {
  results?: ResultApi[];
  total_results?: number;
};

export type SiretSearchHit = {
  siret: string;
  siren: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  activite: string | null;
  actif: boolean;
};

function formatHit(result: ResultApi): SiretSearchHit | null {
  const siege = result.siege ?? null;
  const siret = siege?.siret ?? "";
  const siren = result.siren ?? "";
  if (!siret || !siren) return null;

  const nom =
    (result.nom_complet ?? result.nom_raison_sociale ?? "").trim() ||
    "Entreprise sans nom";

  const rawAdresse = (siege?.adresse ?? "").trim();
  const codePostal = (siege?.code_postal ?? "").trim();
  const ville = (siege?.libelle_commune ?? "").trim();

  let adresse = rawAdresse;
  if (!adresse && (codePostal || ville)) {
    adresse = `${codePostal} ${ville}`.trim();
  }

  return {
    siret,
    siren,
    nom,
    adresse,
    codePostal,
    ville,
    activite: result.activite_principale ?? null,
    actif: (result.etat_administratif ?? "").toUpperCase() === "A",
  };
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`insee-search:${userId}`, 30, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const url = new URL(INSEE_API);
    url.searchParams.set("q", q);
    url.searchParams.set("page", "1");
    url.searchParams.set("per_page", "8");
    url.searchParams.set("etat_administratif", "A");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 86_400 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { results: [], error: `Annuaire indisponible (${res.status})` },
        { status: 200 },
      );
    }

    const payload = (await res.json()) as InseeResponse;
    const hits = (payload.results ?? [])
      .map(formatHit)
      .filter((hit): hit is SiretSearchHit => hit !== null)
      .slice(0, 8);

    return NextResponse.json(
      { results: hits, total: payload.total_results ?? hits.length },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=900",
        },
      },
    );
  } catch (error) {
    return internalServerError(
      "insee-search",
      error,
      "Recherche entreprise impossible",
    );
  }
}
