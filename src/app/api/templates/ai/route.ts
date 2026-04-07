import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { TRADE_OPTIONS, getTradeDefinition, getTradeBundlesForTrade } from "@/lib/trades";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/http";

type AILigne = {
  nomPrestation: string;
  description?: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
};

type AITemplateResponse = {
  titre: string;
  lignes: AILigne[];
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const rl = rateLimit(`ai-templates:${userId}`, 5, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const { prompt, trade } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
    }

    // Si pas d'API key AI, fallback sur les templates existants
    if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Configuration IA manquante" }, { status: 503 });
    }

    const tradeDef = getTradeDefinition(trade);
    const tradeContext = tradeDef
      ? `Métier : ${tradeDef.label}. ${tradeDef.summary}`
      : "Métier non spécifié";

    // Construire le prompt pour l'IA
    const systemPrompt = `Tu es un assistant expert en devis pour artisans français.
Tu dois générer des lignes de devis précises et réalistes.

Format de réponse JSON UNIQUEMENT (pas de markdown, pas d'explication) :
{
  "titre": "Titre du devis",
  "lignes": [
    {
      "nomPrestation": "Nom de la prestation",
      "description": "Description courte optionnelle",
      "quantite": 1,
      "unite": "m²|ml|unité|forfait|heure|jour",
      "prixUnitaire": 25.50
    }
  ]
}

Règles :
- Prix cohérents avec le marché français 2025
- Unités standards : m², ml, unité, forfait, heure, jour
- Quantités réalistes pour un chantier moyen
- 5 à 10 lignes maximum
- Inclure toujours une ligne "Déplacement" si pertinent
- Réponds UNIQUEMENT le JSON valide, rien d'autre`;

    const userPrompt = `${tradeContext}

Description du chantier du client : ${prompt}

Génère les lignes de devis appropriées.`;

    // Appel à l'IA via OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://zolio.fr",
        "X-Title": "Zolio",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Erreur IA: ${response.status}`, details: err }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "Réponse IA invalide" }, { status: 502 });
    }

    // Parser le JSON de la réponse
    try {
      // Essayer de parser directement
      const parsed = JSON.parse(content) as AITemplateResponse;

      // Validation basique
      if (!parsed.titre || !Array.isArray(parsed.lignes)) {
        throw new Error("Format invalide");
      }

      // Nettoyer les lignes
      const lignes: AILigne[] = parsed.lignes
        .filter((l) => l.nomPrestation && Number(l.quantite) > 0 && Number(l.prixUnitaire) > 0)
        .map((l) => ({
          nomPrestation: l.nomPrestation.trim(),
          description: l.description?.trim(),
          quantite: Math.round(Number(l.quantite) * 100) / 100,
          unite: l.unite || "unité",
          prixUnitaire: Math.round(Number(l.prixUnitaire) * 100) / 100,
        }));

      if (lignes.length === 0) {
        return NextResponse.json({ error: "Aucune ligne valide générée" }, { status: 400 });
      }

      return NextResponse.json({ titre: parsed.titre, lignes });
    } catch {
      // Essayer d'extraire le JSON d'un bloc markdown
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]) as AITemplateResponse;
          const lignes: AILigne[] = parsed.lignes?.map((l) => ({
            nomPrestation: l.nomPrestation.trim(),
            description: l.description?.trim(),
            quantite: Math.round(Number(l.quantite) * 100) / 100,
            unite: l.unite || "unité",
            prixUnitaire: Math.round(Number(l.prixUnitaire) * 100) / 100,
          })) || [];

          return NextResponse.json({ titre: parsed.titre || "Devis IA", lignes });
        } catch {
          // ignore
        }
      }
      return NextResponse.json({ error: "Impossible de parser la réponse IA" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Erreur interne", details: err instanceof Error ? err.message : "Inconnue" }, { status: 500 });
  }
}

// GET retourne les templates existants par métier
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const trades = TRADE_OPTIONS.map((trade) => ({
    key: trade.key,
    label: trade.label,
    bundles: getTradeBundlesForTrade(trade.key).map((b: { nom: string; description: string; lignes: unknown[] }) => ({
      nom: b.nom,
      description: b.description,
      lignes: b.lignes,
    })),
  }));

  return NextResponse.json({ trades });
}
