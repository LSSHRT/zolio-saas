import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendProspectEmail } from "@/lib/sendEmail";
import { auth, currentUser } from "@clerk/nextjs/server";

// Optionnel: vérifier si l'utilisateur est admin
// Pour l'instant, on vérifie juste qu'il est connecté. On pourrait ajouter une vérification d'email
const ADMIN_EMAILS = ["admin@zolio.site", "valentindelaunay@gmail.com"]; // Ajustez selon les besoins réels

async function isAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  
  // Pour le test on autorise tout utilisateur authentifié ou on peut restreindre
  // return userEmail && ADMIN_EMAILS.includes(userEmail);
  return true; // À sécuriser si nécessaire en prod
}

export async function GET() {
  try {
    const isAuthorized = await isAdmin();
    if (!isAuthorized) return new NextResponse("Non autorisé", { status: 401 });

    const mails = await prisma.prospectMail.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(mails);
  } catch (error) {
    console.error("Erreur GET mails admin:", error);
    return NextResponse.json({ error: "Impossible de récupérer les emails" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await isAdmin();
    if (!isAuthorized) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "L'adresse email est requise" }, { status: 400 });
    }

    try {
      await sendProspectEmail(email);
      
      const saved = await prisma.prospectMail.create({
        data: {
          email,
          status: "Sent",
          source: "Manual"
        }
      });
      
      return NextResponse.json(saved);
    } catch (emailErr) {
      console.error("Erreur lors de l'envoi de l'email:", emailErr);
      
      const failed = await prisma.prospectMail.create({
        data: {
          email,
          status: "Failed",
          source: "Manual"
        }
      });
      
      return NextResponse.json(failed, { status: 500, statusText: "Erreur d'envoi" });
    }
  } catch (error) {
    console.error("Erreur POST admin mail:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}