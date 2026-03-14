import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMappings() {
  try {
    const clients = await prisma.client.findMany();
    console.log(`Found ${clients.length} clients`);
    clients.map((c: any) => ({
      id: c.id,
      nom: c.nom,
      email: c.email || "",
      telephone: c.telephone || "",
      adresse: c.adresse || "",
      dateAjout: c.createdAt.toLocaleDateString("fr-FR"),
    }));
    console.log("Clients mapped successfully.");
  } catch (e) {
    console.error("Error mapping clients:", e);
  }

  try {
    const devis = await prisma.devis.findMany({ include: { client: true } });
    console.log(`Found ${devis.length} devis`);
    devis.map((d: any) => ({
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
    console.log("Devis mapped successfully.");
  } catch (e) {
    console.error("Error mapping devis:", e);
  }

  try {
    const prestations = await prisma.prestation.findMany();
    console.log(`Found ${prestations.length} prestations`);
    prestations.map((p: any) => ({
      id: p.id,
      nom: p.nom,
      description: p.description || "",
      unite: p.unite || "",
      prix: p.prix || 0,
      cout: p.cout || 0,
      stock: p.stock || 0
    }));
    console.log("Prestations mapped successfully.");
  } catch (e) {
    console.error("Error mapping prestations:", e);
  }
}

testMappings().finally(() => prisma.$disconnect());
