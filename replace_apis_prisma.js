const fs = require('fs');
const path = require('path');

const files = {
  "src/app/api/clients/route.ts": `import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const mappedClients = clients.map(c => ({
      id: c.id,
      nom: c.nom,
      email: c.email || "",
      telephone: c.telephone || "",
      adresse: c.adresse || "",
      dateAjout: c.createdAt.toLocaleDateString("fr-FR"),
    }));

    return NextResponse.json(mappedClients);
  } catch (error) {
    console.error("Erreur GET clients:", error);
    return NextResponse.json({ error: "Impossible de récupérer les clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();

    if (Array.isArray(body)) {
      const data = body.map(item => ({
        userId,
        nom: item.nom,
        email: item.email || "",
        telephone: item.telephone || "",
        adresse: item.adresse || "",
      }));
      await prisma.client.createMany({ data });
      return NextResponse.json({ success: true, count: data.length });
    }

    const { nom, email, telephone, adresse } = body;
    const client = await prisma.client.create({
      data: { userId, nom, email, telephone, adresse }
    });

    return NextResponse.json({
      id: client.id,
      nom: client.nom,
      email: client.email || "",
      telephone: client.telephone || "",
      adresse: client.adresse || "",
      dateAjout: client.createdAt.toLocaleDateString("fr-FR")
    });
  } catch (error) {
    console.error("Erreur POST client:", error);
    return NextResponse.json({ error: "Impossible d'ajouter le client" }, { status: 500 });
  }
}`,

  "src/app/api/prestations/route.ts": `import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const prestations = await prisma.prestation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = prestations.map(p => ({
      id: p.id,
      nom: p.nom,
      description: p.description || "",
      unite: p.unite || "",
      prix: p.prix,
      cout: p.cout || 0,
      stock: p.stock || 0
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Erreur GET prestations:", error);
    return NextResponse.json({ error: "Impossible de récupérer les prestations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();

    if (Array.isArray(body)) {
      const data = body.map(item => ({
        userId,
        nom: item.nom,
        description: item.description || "",
        unite: item.unite || "",
        prix: parseFloat(item.prix),
        cout: parseFloat(item.cout || 0),
        stock: parseInt(item.stock || 0)
      }));
      await prisma.prestation.createMany({ data });
      return NextResponse.json({ success: true, count: data.length });
    }

    const { nom, description, unite, prix, cout, stock } = body;
    const prestation = await prisma.prestation.create({
      data: {
        userId,
        nom,
        description: description || "",
        unite: unite || "",
        prix: parseFloat(prix),
        cout: parseFloat(cout || 0),
        stock: parseInt(stock || 0)
      }
    });

    return NextResponse.json({
      id: prestation.id,
      nom: prestation.nom,
      description: prestation.description || "",
      unite: prestation.unite || "",
      prix: prestation.prix,
      cout: prestation.cout || 0,
      stock: prestation.stock || 0
    });
  } catch (error) {
    console.error("Erreur POST prestation:", error);
    return NextResponse.json({ error: "Impossible d'ajouter la prestation" }, { status: 500 });
  }
}`,

  "src/app/api/prestations/[id]/route.ts": `import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const body = await request.json();
    const { nom, description, unite, prix, cout, stock } = body;

    const prestation = await prisma.prestation.updateMany({
      where: { id, userId },
      data: {
        nom,
        description: description || "",
        unite: unite || "",
        prix: parseFloat(prix),
        cout: parseFloat(cout || 0),
        stock: parseInt(stock || 0)
      }
    });

    if (prestation.count === 0) {
       return new NextResponse("Prestation non trouvée", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT prestation:", error);
    return NextResponse.json({ error: "Impossible de modifier la prestation" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    await prisma.prestation.deleteMany({
      where: { id, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE prestation:", error);
    return NextResponse.json({ error: "Impossible de supprimer la prestation" }, { status: 500 });
  }
}`,

  "src/app/api/depenses/route.ts": `import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const depenses = await prisma.depense.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    const mapped = depenses.map(d => ({
      id: d.id,
      description: d.description,
      montant: d.montant,
      date: d.date.toISOString().split('T')[0],
      categorie: d.categorie || ""
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Erreur GET depenses:", error);
    return NextResponse.json({ error: "Impossible de récupérer les dépenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();
    const { description, montant, date, categorie } = body;

    const depense = await prisma.depense.create({
      data: {
        userId,
        description,
        montant: parseFloat(montant),
        date: new Date(date || new Date()),
        categorie: categorie || ""
      }
    });

    return NextResponse.json({
      id: depense.id,
      description: depense.description,
      montant: depense.montant,
      date: depense.date.toISOString().split('T')[0],
      categorie: depense.categorie || ""
    });
  } catch (error) {
    console.error("Erreur POST depense:", error);
    return NextResponse.json({ error: "Impossible d'ajouter la dépense" }, { status: 500 });
  }
}`,

  "src/app/api/depenses/[id]/route.ts": `import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    await prisma.depense.deleteMany({
      where: { id, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE depense:", error);
    return NextResponse.json({ error: "Impossible de supprimer la dépense" }, { status: 500 });
  }
}`,

  "src/app/api/devis/route.ts": `import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const devis = await prisma.devis.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = devis.map(d => ({
      numero: d.numero,
      client: d.client ? d.client.nom : "Inconnu",
      clientId: d.clientId,
      date: d.date.toLocaleDateString("fr-FR"),
      statut: d.statut,
      lignes: typeof d.lignes === 'string' ? JSON.parse(d.lignes) : d.lignes,
      remise: d.remise || 0,
      acompte: d.acompte || 0,
      tva: d.tva || 0,
      signature: d.signature || "",
      photos: typeof d.photos === 'string' ? JSON.parse(d.photos) : (d.photos || []),
      dateDebut: d.dateDebut ? d.dateDebut.toISOString().split('T')[0] : "",
      dateFin: d.dateFin ? d.dateFin.toISOString().split('T')[0] : ""
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Erreur GET devis:", error);
    return NextResponse.json({ error: "Impossible de récupérer les devis" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();
    const { client, clientId, lignes, remise, acompte, tva, photos } = body;

    let finalClientId = clientId;
    if (!finalClientId && client) {
      // Find or create client
      const existingClient = await prisma.client.findFirst({
        where: { userId, nom: client }
      });
      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: { userId, nom: client }
        });
        finalClientId = newClient.id;
      }
    }

    const currentYear = new Date().getFullYear();
    
    // Calculate new devis number
    const count = await prisma.devis.count({
       where: { userId, numero: { startsWith: \`DEV-\${currentYear}-\` } }
    });
    const nextNum = count + 1;
    const numero = \`DEV-\${currentYear}-\${String(nextNum).padStart(3, "0")}\`;

    const devis = await prisma.devis.create({
      data: {
        userId,
        numero,
        clientId: finalClientId,
        lignes: typeof lignes === 'string' ? JSON.parse(lignes) : lignes,
        remise: parseFloat(remise || 0),
        acompte: parseFloat(acompte || 0),
        tva: parseFloat(tva || 0),
        photos: typeof photos === 'string' ? JSON.parse(photos) : (photos || []),
        statut: "En attente"
      },
      include: { client: true }
    });

    return NextResponse.json({
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut
    });
  } catch (error) {
    console.error("Erreur POST devis:", error);
    return NextResponse.json({ error: "Impossible de créer le devis" }, { status: 500 });
  }
}`,

  "src/app/api/devis/[numero]/route.ts": `export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true }
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    return NextResponse.json({
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      clientId: devis.clientId,
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut,
      lignes: typeof devis.lignes === 'string' ? JSON.parse(devis.lignes) : devis.lignes,
      remise: devis.remise,
      acompte: devis.acompte,
      tva: devis.tva,
      signature: devis.signature || "",
      photos: typeof devis.photos === 'string' ? JSON.parse(devis.photos) : (devis.photos || []),
      dateDebut: devis.dateDebut ? devis.dateDebut.toISOString().split('T')[0] : "",
      dateFin: devis.dateFin ? devis.dateFin.toISOString().split('T')[0] : ""
    });
  } catch (error) {
    console.error("Erreur GET devis detaillé:", error);
    return NextResponse.json({ error: "Impossible de récupérer le devis" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const body = await request.json();
    const { client, clientId, lignes, remise, acompte, tva, statut, photos } = body;

    let finalClientId = clientId;
    if (!finalClientId && client) {
      const existingClient = await prisma.client.findFirst({
        where: { userId, nom: client }
      });
      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: { userId, nom: client }
        });
        finalClientId = newClient.id;
      }
    }

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: {
        clientId: finalClientId,
        lignes: typeof lignes === 'string' ? JSON.parse(lignes) : lignes,
        remise: parseFloat(remise || 0),
        acompte: parseFloat(acompte || 0),
        tva: parseFloat(tva || 0),
        statut: statut || "En attente",
        signature: "", // reset signature on edit
        photos: typeof photos === 'string' ? JSON.parse(photos) : (photos || [])
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT devis:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour le devis" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    await prisma.devis.deleteMany({
      where: { numero, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE devis:", error);
    return NextResponse.json({ error: "Impossible de supprimer le devis" }, { status: 500 });
  }
}`,

  "src/app/api/devis/[numero]/duplicate/route.ts": `import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    const devis = await prisma.devis.findFirst({
      where: { numero, userId }
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    const currentYear = new Date().getFullYear();
    const count = await prisma.devis.count({
       where: { userId, numero: { startsWith: \`DEV-\${currentYear}-\` } }
    });
    const nextNum = count + 1;
    const nextNumero = \`DEV-\${currentYear}-\${String(nextNum).padStart(3, "0")}\`;

    const newDevis = await prisma.devis.create({
      data: {
        userId,
        numero: nextNumero,
        clientId: devis.clientId,
        lignes: devis.lignes,
        remise: devis.remise,
        acompte: devis.acompte,
        tva: devis.tva,
        photos: devis.photos,
        statut: "En attente"
      }
    });

    return NextResponse.json({ success: true, newNumero: newDevis.numero });
  } catch (error) {
    console.error("Erreur POST duplicate devis:", error);
    return NextResponse.json({ error: "Impossible de dupliquer le devis" }, { status: 500 });
  }
}`,

  "src/app/api/devis/[numero]/statut/route.ts": `import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { statut } = await request.json();

    if (!statut) return new NextResponse("Statut manquant", { status: 400 });

    const devis = await prisma.devis.findFirst({
      where: { numero, userId }
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    // Handle stock updates if moving to Facturé/Payé from another status
    const previousStatut = devis.statut;
    const isNewSale = (statut === "Facturé" || statut === "Payé") && previousStatut !== "Facturé" && previousStatut !== "Payé";
    const isCancelSale = (previousStatut === "Facturé" || previousStatut === "Payé") && (statut !== "Facturé" && statut !== "Payé");

    const lignes = typeof devis.lignes === 'string' ? JSON.parse(devis.lignes) : (devis.lignes || []);

    if (isNewSale) {
      for (const ligne of lignes) {
        if (!ligne.optionnel && ligne.nom) {
          const prestation = await prisma.prestation.findFirst({
            where: { userId, nom: ligne.nom }
          });
          if (prestation && prestation.stock !== null && prestation.stock !== undefined) {
             await prisma.prestation.update({
               where: { id: prestation.id },
               data: { stock: prestation.stock - parseInt(ligne.quantite || "1") }
             });
          }
        }
      }
    } else if (isCancelSale) {
      for (const ligne of lignes) {
        if (!ligne.optionnel && ligne.nom) {
          const prestation = await prisma.prestation.findFirst({
            where: { userId, nom: ligne.nom }
          });
          if (prestation && prestation.stock !== null && prestation.stock !== undefined) {
             await prisma.prestation.update({
               where: { id: prestation.id },
               data: { stock: prestation.stock + parseInt(ligne.quantite || "1") }
             });
          }
        }
      }
    }

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: { statut }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT statut devis:", error);
    return NextResponse.json({ error: "Impossible de modifier le statut" }, { status: 500 });
  }
}`,

  "src/app/api/devis/[numero]/planning/route.ts": `import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { dateDebut, dateFin } = await request.json();

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: {
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT planning devis:", error);
    return NextResponse.json({ error: "Impossible de sauvegarder le planning" }, { status: 500 });
  }
}`,

  "src/app/api/public/devis/[numero]/route.ts": `export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDevisSignedEmail } from "@/lib/sendEmail";
import { generatePdfBuffer } from "@/lib/generatePdf";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("u");

    if (!userId) return new NextResponse("User ID manquant", { status: 400 });

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true }
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    const clientData = await clerkClient();
    const user = await clientData.users.getUser(userId);

    const devisData = {
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut,
      lignes: typeof devis.lignes === 'string' ? JSON.parse(devis.lignes) : devis.lignes,
      remise: devis.remise,
      acompte: devis.acompte,
      tva: devis.tva,
      signature: devis.signature || "",
      photos: typeof devis.photos === 'string' ? JSON.parse(devis.photos) : (devis.photos || []),
      entrepriseInfo: {
        nom: user.firstName ? \`\${user.firstName} \${user.lastName || ""}\`.trim() : "Mon Entreprise",
        email: user.emailAddresses[0]?.emailAddress || "",
        telephone: user.unsafeMetadata?.telephone as string || "",
        adresse: user.unsafeMetadata?.adresse as string || "",
        siret: user.unsafeMetadata?.siret as string || "",
        rib: user.unsafeMetadata?.rib as string || "",
        color: user.unsafeMetadata?.color as string || "#6b21a8",
        logoUrl: user.unsafeMetadata?.logoUrl as string || "",
        statutJuridique: user.unsafeMetadata?.statutJuridique as string || "",
        assurance: user.unsafeMetadata?.assurance as string || "",
        mentions: user.unsafeMetadata?.mentions as string || ""
      }
    };

    return NextResponse.json(devisData);
  } catch (error) {
    console.error("Erreur GET public devis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("u");

    if (!userId) return new NextResponse("User ID manquant", { status: 400 });

    const body = await request.json();
    const { signature } = body;

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true }
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: {
        statut: "Accepté",
        signature: signature || ""
      }
    });

    // Send email with PDF
    try {
      const clientData = await clerkClient();
      const user = await clientData.users.getUser(userId);
      const emailClient = devis.client?.email;
      
      if (emailClient && signature) {
        const fullDevisData = {
          numero: devis.numero,
          client: devis.client ? devis.client.nom : "",
          date: devis.date.toLocaleDateString("fr-FR"),
          statut: "Accepté",
          lignes: typeof devis.lignes === 'string' ? JSON.parse(devis.lignes) : devis.lignes,
          remise: devis.remise,
          acompte: devis.acompte,
          tva: devis.tva,
          signature: signature,
          photos: typeof devis.photos === 'string' ? JSON.parse(devis.photos) : (devis.photos || [])
        };

        const entrepriseInfo = {
          nom: user.firstName ? \`\${user.firstName} \${user.lastName || ""}\`.trim() : "Mon Entreprise",
          email: user.emailAddresses[0]?.emailAddress || "",
          telephone: user.unsafeMetadata?.telephone as string || "",
          adresse: user.unsafeMetadata?.adresse as string || "",
          siret: user.unsafeMetadata?.siret as string || "",
          rib: user.unsafeMetadata?.rib as string || "",
          color: user.unsafeMetadata?.color as string || "#6b21a8",
          logoUrl: user.unsafeMetadata?.logoUrl as string || "",
          statutJuridique: user.unsafeMetadata?.statutJuridique as string || "",
          assurance: user.unsafeMetadata?.assurance as string || "",
          mentions: user.unsafeMetadata?.mentions as string || ""
        };

        const pdfBuffer = await generatePdfBuffer(fullDevisData as any, entrepriseInfo, "Devis", fullDevisData.client);
        await sendDevisSignedEmail(emailClient, entrepriseInfo.nom, devis.numero, pdfBuffer);
      }
    } catch (e) {
      console.error("Erreur envoi email PDF:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST public devis:", error);
    return NextResponse.json({ error: "Erreur lors de la signature" }, { status: 500 });
  }
}`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, content);
  console.log('Updated ' + filepath);
}
