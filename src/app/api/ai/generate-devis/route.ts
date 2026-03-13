import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Clé API Gemini non configurée" }, { status: 500 });
    }

    const { description } = await req.json();
    if (!description) {
      return NextResponse.json({ error: "Description manquante" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Tu es un assistant expert pour les artisans du bâtiment.
Génère une liste de prestations pour un devis basé sur la description suivante : "${description}".
Réponds UNIQUEMENT au format JSON avec un tableau d'objets, sans aucun texte autour, sans bloc markdown.
Chaque objet doit avoir ces propriétés exactes :
- "designation" (string, description claire et professionnelle de la tâche)
- "quantite" (number)
- "unite" (string, ex: "m2", "h", "u", "forfait")
- "prixUnitaire" (number, estimation réaliste du prix en euros)

Exemple:
[
  { "designation": "Dépose de l'existant", "quantite": 1, "unite": "forfait", "prixUnitaire": 350 },
  { "designation": "Fourniture et pose de carrelage mural", "quantite": 15, "unite": "m2", "prixUnitaire": 65 }
]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Nettoyer la réponse au cas où il y aurait du markdown
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const lignes = JSON.parse(cleanedText);

    return NextResponse.json({ lignes });
  } catch (error) {
    console.error("Erreur IA:", error);
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
