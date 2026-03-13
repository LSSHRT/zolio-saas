import { NextRequest, NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
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

    let result;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      result = await model.generateContent(prompt);
    } catch (e: any) {
      console.warn("Modèle gemini-3-flash-preview introuvable ou erreur, tentative avec gemini-2.5-flash...", e.message);
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        result = await fallbackModel.generateContent(prompt);
      } catch (e2: any) {
        console.warn("Modèle gemini-2.5-flash introuvable, tentative avec gemini-2.0-flash...", e2.message);
        const fallbackModel2 = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        result = await fallbackModel2.generateContent(prompt);
      }
    }
    const responseText = result.response.text();
    
    // Nettoyer la réponse au cas où il y aurait du markdown
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const lignes = JSON.parse(cleanedText);

    // Incrémenter le compteur IA pour l'utilisateur
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const currentCount = (user.publicMetadata?.aiDevisCount as number) || 0;
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          aiDevisCount: currentCount + 1
        }
      });
    } catch (e) {
      console.error("Erreur incrementation compteur IA:", e);
    }

    return NextResponse.json({ lignes });
  } catch (error) {
    console.error("Erreur IA:", error);
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
