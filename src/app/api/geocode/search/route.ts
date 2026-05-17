import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse, internalServerError } from "@/lib/http";

const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_TIMEOUT_MS = 5_000;
// Nominatim TOS impose un User-Agent identifiant. Cf https://operations.osmfoundation.org/policies/nominatim/
const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ??
  "Zolio-SaaS/1.0 (https://zolio.fr; contact@zolio.fr)";

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  cycleway?: string;
  path?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
};

type NominatimResult = {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
  address?: NominatimAddress;
};

export type AddressSearchHit = {
  id: string;
  label: string;
  voie: string;
  codePostal: string;
  ville: string;
  pays: string;
  latitude: number | null;
  longitude: number | null;
};

function pickStreet(address: NominatimAddress | undefined): string {
  if (!address) return "";
  return (
    address.road ??
    address.pedestrian ??
    address.footway ??
    address.cycleway ??
    address.path ??
    ""
  ).trim();
}

function pickCity(address: NominatimAddress | undefined): string {
  if (!address) return "";
  return (
    address.city ??
    address.town ??
    address.village ??
    address.hamlet ??
    address.municipality ??
    address.suburb ??
    address.neighbourhood ??
    ""
  ).trim();
}

function formatHit(result: NominatimResult): AddressSearchHit | null {
  const placeId = result.place_id;
  if (placeId === undefined) return null;

  const address = result.address;
  const numero = (address?.house_number ?? "").trim();
  const street = pickStreet(address);
  const ville = pickCity(address);
  const codePostal = (address?.postcode ?? "").trim();
  const pays = (address?.country ?? "").trim();

  const voiePart = [numero, street].filter(Boolean).join(" ").trim();
  const cityPart = [codePostal, ville].filter(Boolean).join(" ").trim();
  const labelParts = [voiePart, cityPart].filter(Boolean);
  const label = labelParts.length > 0 ? labelParts.join(", ") : (result.display_name ?? "").trim();
  if (!label) return null;

  const lat = result.lat ? Number.parseFloat(result.lat) : NaN;
  const lon = result.lon ? Number.parseFloat(result.lon) : NaN;

  return {
    id: String(placeId),
    label,
    voie: voiePart,
    codePostal,
    ville,
    pays,
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lon) ? lon : null,
  };
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`geocode-search:${userId}`, 30, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const url = new URL(NOMINATIM_API);
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "8");
    url.searchParams.set("countrycodes", "fr");
    url.searchParams.set("accept-language", "fr");

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
        next: { revalidate: 86_400 },
        signal: AbortSignal.timeout(NOMINATIM_TIMEOUT_MS),
      });
    } catch (fetchError) {
      const isTimeout =
        fetchError instanceof Error &&
        (fetchError.name === "TimeoutError" || fetchError.name === "AbortError");
      return NextResponse.json(
        {
          results: [],
          error: isTimeout
            ? "Annuaire d'adresses lent — réessayez dans un instant."
            : "Annuaire d'adresses injoignable",
        },
        { status: 200 },
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { results: [], error: `Annuaire d'adresses indisponible (${res.status})` },
        { status: 200 },
      );
    }

    const payload = (await res.json()) as NominatimResult[] | { error?: string };
    if (!Array.isArray(payload)) {
      return NextResponse.json(
        {
          results: [],
          error: payload.error ?? "Réponse inattendue de l'annuaire d'adresses",
        },
        { status: 200 },
      );
    }

    const hits = payload
      .map(formatHit)
      .filter((hit): hit is AddressSearchHit => hit !== null)
      .slice(0, 8);

    return NextResponse.json(
      { results: hits, total: hits.length },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=900",
        },
      },
    );
  } catch (error) {
    return internalServerError(
      "geocode-search",
      error,
      "Recherche d'adresse impossible",
    );
  }
}
