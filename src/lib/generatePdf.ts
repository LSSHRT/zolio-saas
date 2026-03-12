import { jsPDF } from "jspdf";


async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error("Erreur de récupération du logo:", error);
    return null;
  }
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 14, g: 165, b: 233 };
}

interface LigneDevis {
  nomPrestation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  totalLigne: number;
}

interface DevisData {
  numeroDevis: string;
  date: string;
  client: { nom: string; email: string; telephone: string; adresse: string; };
  isPro?: boolean;
  entreprise?: { nom: string; email: string; telephone?: string; adresse?: string; siret?: string; color?: string; logo?: string; iban?: string; bic?: string; legal?: string; };
  lignes: LigneDevis[];
  totalHT: string;
  tva: string;
  totalTTC: string;
}

export async function generateDevisPDF(data: DevisData): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // === HEADER ===
  const color = hexToRgb(data.entreprise?.color || "#0ea5e9");
  doc.setFillColor(color.r, color.g, color.b);
  doc.rect(0, 0, pageWidth, 45, "F");

  let logoWidth = 0;
  if (data.entreprise?.logo) {
    const logoBase64 = await fetchImageAsBase64(data.entreprise.logo);
    if (logoBase64) {
      try {
        // dimensions fixes (ex: 30x30, ou calculé)
        // par defaut 30x30
        doc.addImage(logoBase64, 15, 7, 30, 30);
        logoWidth = 35; // décalage pour le texte
      } catch (e) {
        console.error("Erreur ajout logo:", e);
      }
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("ZOLIO", 20 + logoWidth, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Devis professionnel", 20 + logoWidth, 35);

  // Numéro et date à droite
  doc.setFontSize(11);
  doc.text(data.numeroDevis, pageWidth - 20, 25, { align: "right" });
  doc.text(`Date : ${data.date}`, pageWidth - 20, 35, { align: "right" });

  // === INFORMATIONS ===
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Émetteur", 20, 65);
  doc.text("Client", 120, 65);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Émetteur
  if (data.entreprise) {
    let currentY = 73;
    doc.text(data.entreprise.nom, 20, currentY); currentY += 7;
    doc.text(data.entreprise.email, 20, currentY); currentY += 7;
    if (data.entreprise.telephone) { doc.text(`Tél: ${data.entreprise.telephone}`, 20, currentY); currentY += 7; }
    if (data.entreprise.siret) { doc.text(`SIRET: ${data.entreprise.siret}`, 20, currentY); currentY += 7; }
    if (data.entreprise.adresse) {
      const splitAdresse = doc.splitTextToSize(data.entreprise.adresse, 80);
      doc.text(splitAdresse, 20, currentY);
    }
  } else {
    doc.text("Zolio", 20, 73);
  }

  // Client
  doc.text(data.client.nom, 120, 73);
  doc.text(data.client.email, 120, 80);
  if (data.client.telephone) doc.text(`Tél: ${data.client.telephone}`, 120, 87);
  if (data.client.adresse) {
    const splitAdresse = doc.splitTextToSize(data.client.adresse, 70);
    doc.text(splitAdresse, 120, 94);
  }

  // === TABLE HEADER ===
  let y = 110;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y - 5, pageWidth - 30, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Prestation", 20, y);
  doc.text("Qté", 110, y);
  doc.text("Unité", 125, y);
  doc.text("P.U. HT", 148, y, { align: "right" });
  doc.text("Total HT", pageWidth - 20, y, { align: "right" });

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y - 3, pageWidth - 15, y - 3);

  // === LIGNES ===
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);

  for (const ligne of data.lignes) {
    doc.text(ligne.nomPrestation.substring(0, 40), 20, y + 2);
    doc.text(String(ligne.quantite), 112, y + 2);
    doc.text(ligne.unite, 125, y + 2);
    doc.text(`${ligne.prixUnitaire.toFixed(2)}€`, 148, y + 2, { align: "right" });
    doc.text(`${ligne.totalLigne.toFixed(2)}€`, pageWidth - 20, y + 2, { align: "right" });
    y += 10;

    doc.setDrawColor(241, 245, 249);
    doc.line(20, y - 3, pageWidth - 20, y - 3);
  }

  // === TOTAUX ===
  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(120, y - 5, pageWidth - 15, y - 5);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Total HT", 125, y);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.totalHT}€`, pageWidth - 20, y, { align: "right" });

  y += 8;
  doc.setTextColor(100, 116, 139);
  doc.text(`TVA (${data.tva})`, 125, y);
  doc.setTextColor(15, 23, 42);
  const tvaAmount = (parseFloat(data.totalTTC) - parseFloat(data.totalHT)).toFixed(2);
  doc.text(`${tvaAmount}€`, pageWidth - 20, y, { align: "right" });

  y += 12;
  doc.setFillColor(color.r, color.g, color.b);
  doc.roundedRect(120, y - 7, pageWidth - 135, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total TTC", 125, y + 2);
  doc.text(`${data.totalTTC}€`, pageWidth - 22, y + 2, { align: "right" });

  // === SIGNATURE ===
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Date et signature précédées de la mention", 20, y + 23);
  doc.text("'Bon pour accord'", 20, y + 28);
  doc.setDrawColor(203, 213, 225);
  doc.rect(20, y + 32, 80, 25);

  // === COORDONNÉES BANCAIRES ===
  if (data.entreprise?.iban) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Coordonnées bancaires pour le règlement :", 110, y + 25);
    doc.setFont("helvetica", "normal");
    doc.text(`IBAN : ${data.entreprise.iban}`, 110, y + 32);
    if (data.entreprise.bic) {
      doc.text(`BIC : ${data.entreprise.bic}`, 110, y + 38);
    }
  }

  // === FOOTER ===
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (data.entreprise?.legal) {
    doc.text(data.entreprise.legal, pageWidth / 2, footerY - 5, { align: "center" });
  }
  if (!data.isPro) {
    doc.text("Devis gratuit généré par Zolio · zolio.site", pageWidth / 2, footerY, { align: "center" });
  }
  doc.text("Ce devis est valable 30 jours à compter de sa date d'émission.", pageWidth / 2, footerY + 5, { align: "center" });

  // Retourner un Buffer
  return Buffer.from(doc.output("arraybuffer"));
}

export async function generateFacturePDF(data: DevisData): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // === HEADER ===
  const color = hexToRgb(data.entreprise?.color || "#0ea5e9");
  doc.setFillColor(color.r, color.g, color.b);
  doc.rect(0, 0, pageWidth, 45, "F");

  let logoWidth = 0;
  if (data.entreprise?.logo) {
    const logoBase64 = await fetchImageAsBase64(data.entreprise.logo);
    if (logoBase64) {
      try {
        // dimensions fixes (ex: 30x30, ou calculé)
        // par defaut 30x30
        doc.addImage(logoBase64, 15, 7, 30, 30);
        logoWidth = 35; // décalage pour le texte
      } catch (e) {
        console.error("Erreur ajout logo:", e);
      }
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("ZOLIO", 20 + logoWidth, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Facture", 20 + logoWidth, 35);

  // Numéro et date à droite
  doc.setFontSize(11);
  doc.text(data.numeroDevis, pageWidth - 20, 25, { align: "right" });
  doc.text(`Date : ${data.date}`, pageWidth - 20, 35, { align: "right" });

  // === INFORMATIONS ===
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Émetteur", 20, 65);
  doc.text("Client", 120, 65);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Émetteur
  if (data.entreprise) {
    let currentY = 73;
    doc.text(data.entreprise.nom, 20, currentY); currentY += 7;
    doc.text(data.entreprise.email, 20, currentY); currentY += 7;
    if (data.entreprise.telephone) { doc.text(`Tél: ${data.entreprise.telephone}`, 20, currentY); currentY += 7; }
    if (data.entreprise.siret) { doc.text(`SIRET: ${data.entreprise.siret}`, 20, currentY); currentY += 7; }
    if (data.entreprise.adresse) {
      const splitAdresse = doc.splitTextToSize(data.entreprise.adresse, 80);
      doc.text(splitAdresse, 20, currentY);
    }
  } else {
    doc.text("Zolio", 20, 73);
  }

  // Client
  doc.text(data.client.nom, 120, 73);
  doc.text(data.client.email, 120, 80);
  if (data.client.telephone) doc.text(`Tél: ${data.client.telephone}`, 120, 87);
  if (data.client.adresse) {
    const splitAdresse = doc.splitTextToSize(data.client.adresse, 70);
    doc.text(splitAdresse, 120, 94);
  }

  // === TABLE HEADER ===
  let y = 110;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y - 5, pageWidth - 30, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Prestation", 20, y);
  doc.text("Qté", 110, y);
  doc.text("Unité", 125, y);
  doc.text("P.U. HT", 148, y, { align: "right" });
  doc.text("Total HT", pageWidth - 20, y, { align: "right" });

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y - 3, pageWidth - 15, y - 3);

  // === LIGNES ===
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);

  for (const ligne of data.lignes) {
    doc.text(ligne.nomPrestation.substring(0, 40), 20, y + 2);
    doc.text(String(ligne.quantite), 112, y + 2);
    doc.text(ligne.unite, 125, y + 2);
    doc.text(`${ligne.prixUnitaire.toFixed(2)}€`, 148, y + 2, { align: "right" });
    doc.text(`${ligne.totalLigne.toFixed(2)}€`, pageWidth - 20, y + 2, { align: "right" });
    y += 10;

    doc.setDrawColor(241, 245, 249);
    doc.line(20, y - 3, pageWidth - 20, y - 3);
  }

  // === TOTAUX ===
  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(120, y - 5, pageWidth - 15, y - 5);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Total HT", 125, y);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.totalHT}€`, pageWidth - 20, y, { align: "right" });

  y += 8;
  doc.setTextColor(100, 116, 139);
  doc.text(`TVA (${data.tva})`, 125, y);
  doc.setTextColor(15, 23, 42);
  const tvaAmount = (parseFloat(data.totalTTC) - parseFloat(data.totalHT)).toFixed(2);
  doc.text(`${tvaAmount}€`, pageWidth - 20, y, { align: "right" });

  y += 12;
  doc.setFillColor(color.r, color.g, color.b); // Emerald green for Invoice
  doc.roundedRect(120, y - 7, pageWidth - 135, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total TTC", 125, y + 2);
  doc.text(`${data.totalTTC}€`, pageWidth - 22, y + 2, { align: "right" });

  // === FOOTER ===
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (data.entreprise?.legal) {
    doc.text(data.entreprise.legal, pageWidth / 2, footerY - 5, { align: "center" });
  }
  if (!data.isPro) {
    doc.text("Facture gratuite générée par Zolio · zolio.site", pageWidth / 2, footerY, { align: "center" });
  }
  doc.text("En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.", pageWidth / 2, footerY + 5, { align: "center" });

  // Retourner un Buffer
  return Buffer.from(doc.output("arraybuffer"));
}
