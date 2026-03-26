import { NextRequest, NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { internalServerError, jsonError, logServerError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

type GenerateDevisPayload = {
  description?: unknown;
};

type GeneratedAILine = {
  designation: string;
  prixUnitaire: number;
  quantite: number;
  unite: string;
};

type GeneratedAILineCandidate = {
  designation?: unknown;
  lignes?: unknown;
  prixUnitaire?: unknown;
  quantite?: unknown;
  unite?: unknown;
};

const GEMINI_MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"] as const;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_GENERATED_LINES = 20;

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Number(parsed.toFixed(2));
}

function extractJsonPayload(responseText: string) {
  const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

  if (cleaned.startsWith("[") || cleaned.startsWith("{")) {
    return cleaned;
  }

  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return cleaned.slice(arrayStart, arrayEnd + 1);
  }

  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return cleaned.slice(objectStart, objectEnd + 1);
  }

  return cleaned;
}

function normalizeGeneratedLine(candidate: GeneratedAILineCandidate) {
  const designation = normalizeText(candidate.designation);
  const unite = normalizeText(candidate.unite) || "u";
  const quantite = parsePositiveNumber(candidate.quantite);
  const prixUnitaire = parsePositiveNumber(candidate.prixUnitaire);

  if (!designation || quantite === null || prixUnitaire === null) {
    return null;
  }

  return {
    designation,
    quantite,
    unite,
    prixUnitaire,
  } satisfies GeneratedAILine;
}

function parseGeneratedLines(responseText: string) {
  const parsed = JSON.parse(extractJsonPayload(responseText)) as unknown;

  const rawLines = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as GeneratedAILineCandidate).lignes)
      ? (parsed as { lignes: unknown[] }).lignes
      : [];

  return rawLines
    .map((line) =>
      line && typeof line === "object"
        ? normalizeGeneratedLine(line as GeneratedAILineCandidate)
        : null,
    )
    .filter((line): line is GeneratedAILine => line !== null)
    .slice(0, MAX_GENERATED_LINES);
}

async function resolveGeminiApiKeys() {
  const keys: string[] = [];

  // Clé principale
  const mainKey = normalizeText(process.env.GEMINI_API_KEY);
  if (mainKey) keys.push(mainKey);

  // Clé de fallback (quand le quota est atteint)
  const fallbackKey = normalizeText(process.env.GEMINI_API_KEY_2);
  if (fallbackKey) keys.push(fallbackKey);

  // Clé custom de l'admin
  const adminEmail = normalizeText(process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL);
  if (adminEmail) {
    try {
      const client = await clerkClient();
      const adminUsers = await client.users.getUserList({ emailAddress: [adminEmail] });
      const customKey = normalizeText(adminUsers.data[0]?.publicMetadata?.customGeminiKey);
      if (customKey && !keys.includes(customKey)) keys.push(customKey);
    } catch (error) {
      logServerError("ai-generate-devis-admin-key", error);
    }
  }

  return keys;
}

async function generateGeminiContent(apiKeys: string[], prompt: string) {
  let lastError: unknown = null;

  // Essayer chaque clé API
  for (const apiKey of apiKeys) {
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        if (responseText) {
          return responseText;
        }
      } catch (error: unknown) {
        lastError = error;
        // Si c'est une erreur de quota (429), essayer la clé suivante
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
          break; // Passe à la clé suivante
        }
      }
    }
  }

  throw lastError ?? new Error("Aucune clé API Gemini disponible");
}

async function incrementAiUsageCount(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentCount = typeof user.publicMetadata?.aiDevisCount === "number" ? user.publicMetadata.aiDevisCount : 0;

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        aiDevisCount: currentCount + 1,
      },
    });
  } catch (error) {
    logServerError("ai-generate-devis-counter", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    // Rate limit : 20 générations IA/heure (coûteuse en tokens)
    const rl = rateLimit(`ai-generate:${userId}`, 20, 60 * 60_000);
    if (!rl.allowed) return jsonError("Trop de requêtes. Réessayez plus tard.", 429);

    let body: GenerateDevisPayload;
    try {
      body = (await req.json()) as GenerateDevisPayload;
    } catch {
      return jsonError("Payload invalide", 400);
    }

    const description = normalizeText(body.description);
    if (!description) {
      return jsonError("Description manquante", 400);
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return jsonError(`Description trop longue (${MAX_DESCRIPTION_LENGTH} caractères max)`, 400);
    }

    const geminiApiKeys = await resolveGeminiApiKeys();
    if (geminiApiKeys.length === 0) {
      return jsonError("Clé API Gemini non configurée", 500);
    }

    const prompt = `Tu es un assistant expert pour les artisans du bâtiment.
Génère une liste de prestations pour un devis basé sur la description suivante : ${JSON.stringify(description)}.
Réponds UNIQUEMENT au format JSON avec soit un tableau d'objets, soit un objet de la forme {"lignes": [...]}, sans aucun texte autour et sans bloc markdown.
Chaque ligne doit avoir ces propriétés exactes :
- "designation" (string, description claire et professionnelle de la tâche)
- "quantite" (number strictement positif)
- "unite" (string, ex: "m2", "h", "u", "forfait")
- "prixUnitaire" (number strictement positif, estimation réaliste du prix en euros)
Limite la réponse à ${MAX_GENERATED_LINES} lignes maximum.`;

    const responseText = await generateGeminiContent(geminiApiKeys, prompt);

    let lignes: GeneratedAILine[];
    try {
      lignes = parseGeneratedLines(responseText);
    } catch {
      return jsonError("La réponse IA n’est pas un JSON exploitable", 502);
    }

    if (lignes.length === 0) {
      return jsonError("Aucune ligne exploitable n’a été générée", 502);
    }

    await incrementAiUsageCount(userId);

    return NextResponse.json({ lignes });
  } catch (error) {
    return internalServerError("ai-generate-devis", error, "Erreur lors de la génération");
  }
}
