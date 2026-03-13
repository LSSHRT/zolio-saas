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
  tva?: string;
}

interface DevisData {
  numeroDevis: string;
  date: string;
  client: { nom: string; email: string; telephone: string; adresse: string; };
  isPro?: boolean;
  acompte?: string;
  remise?: string;
  entreprise?: { nom: string; email: string; telephone?: string; adresse?: string; siret?: string; color?: string; logo?: string; iban?: string; bic?: string; legal?: string; cgv?: string; statut?: string; assurance?: string; };
  signatureBase64?: string;
  statut?: string;
  lignes: LigneDevis[];
  totalHT: string;
  tva: string;
  totalTTC: string;
  photos?: string[];
}


function drawWatermark(doc: any, text: string, color: {r: number, g: number, b: number}) {
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
  doc.setTextColor(color.r, color.g, color.b);
  doc.setFontSize(50);
  doc.setFont("helvetica", "bold");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.text(text, pageWidth / 2, pageHeight / 2, { angle: 45, align: "center", baseline: "middle" });
  doc.restoreGraphicsState();
}

export async function generateDevisPDF(data: DevisData): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // === HEADER ===
  const color = hexToRgb(data.entreprise?.color || "#0ea5e9");
  
  // Ligne de couleur en haut
  doc.setFillColor(color.r, color.g, color.b);
  doc.rect(0, 0, pageWidth, 8, "F");

  let logoWidth = 0;
  if (data.entreprise?.logo) {
    const logoBase64 = await fetchImageAsBase64(data.entreprise.logo);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 15, 15, 25, 25);
        logoWidth = 30; // décalage pour le texte
      } catch (e) {
        console.error("Erreur ajout logo:", e);
      }
    }
  }

  doc.setTextColor(15, 23, 42); // Dark slate
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text((data.entreprise?.nom || "MON ENTREPRISE").toUpperCase(), 20 + logoWidth, 28);

  doc.setTextColor(100, 116, 139); // Slate gray
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Devis", 20 + logoWidth, 36);

  // Numéro et date à droite
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.numeroDevis, pageWidth - 20, 28, { align: "right" });
  
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date d'émission : ${data.date}`, pageWidth - 20, 36, { align: "right" });

  // === INFORMATIONS ===
  doc.setFillColor(248, 250, 252); // très léger gris
  doc.roundedRect(15, 48, 85, 45, 3, 3, "F");
  doc.roundedRect(110, 48, 85, 45, 3, 3, "F");

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("ÉMETTEUR", 20, 56);
  doc.text("CLIENT", 115, 56);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Émetteur
  if (data.entreprise) {
    let currentY = 65;
    doc.setFont("helvetica", "bold");
    doc.text(data.entreprise.nom, 20, currentY); currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.text(data.entreprise.email, 20, currentY); currentY += 5;
    if (data.entreprise.telephone) { doc.text(`Tél: ${data.entreprise.telephone}`, 20, currentY); currentY += 5; }
    if (data.entreprise.siret) { doc.text(`SIRET: ${data.entreprise.siret}`, 20, currentY); currentY += 5; }
    if (data.entreprise.adresse) {
      const splitAdresse = doc.splitTextToSize(data.entreprise.adresse, 75);
      doc.text(splitAdresse, 20, currentY);
    }
  } else {
    doc.text("Mon Entreprise", 20, 65);
  }

  // Client
  doc.setFont("helvetica", "bold");
  doc.text(data.client.nom, 115, 65);
  doc.setFont("helvetica", "normal");
  doc.text(data.client.email, 115, 71);
  if (data.client.telephone) doc.text(`Tél: ${data.client.telephone}`, 115, 76);
  if (data.client.adresse) {
    const splitAdresse = doc.splitTextToSize(data.client.adresse, 75);
    doc.text(splitAdresse, 115, 81);
  }

  // === TABLE HEADER ===
  let y = 105;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y - 5, pageWidth - 30, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Prestation", 20, y);
  doc.text("Qté", 100, y);
  doc.text("Unité", 115, y);
  doc.text("TVA", 130, y);
  doc.text("P.U. HT", 150, y, { align: "right" });
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
    doc.text(String(ligne.quantite), 102, y + 2);
    doc.text(ligne.unite, 115, y + 2);
    doc.text(ligne.tva ? `${ligne.tva}%` : (data.tva !== "Multi" ? data.tva : "20%"), 130, y + 2);
    doc.text(`${ligne.prixUnitaire.toFixed(2)}€`, 150, y + 2, { align: "right" });
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
  
  doc.text(data.remise ? "Total HT (avant remise)" : "Total HT", 125, y);
  doc.setTextColor(15, 23, 42);
  
  // Le totalHT reçu est APRÈS remise, on doit calculer le HT avant remise pour l'affichage si remise existe
  let htAffiche = data.totalHT;
  if (data.remise && parseFloat(data.remise) > 0) {
     const remisePct = parseFloat(data.remise);
     const htBase = parseFloat(data.totalHT) / (1 - remisePct / 100);
     htAffiche = htBase.toFixed(2);
  }
  
  doc.text(`${htAffiche}€`, pageWidth - 20, y, { align: "right" });
  
  if (data.remise && parseFloat(data.remise) > 0) {
     y += 8;
     doc.setTextColor(100, 116, 139);
     doc.text(`Remise (${data.remise}%)`, 125, y);
     doc.setTextColor(16, 185, 129); // emerald
     const remiseVal = (parseFloat(htAffiche) - parseFloat(data.totalHT)).toFixed(2);
     doc.text(`-${remiseVal}€`, pageWidth - 20, y, { align: "right" });
  }

  y += 8;

  doc.setTextColor(100, 116, 139);
  if (data.tva === "Multi") {
    // Calculate TVAs per rate
    const tvaMap: Record<string, number> = {};
    for (const l of data.lignes) {
      const rate = l.tva || "20";
      if (!tvaMap[rate]) tvaMap[rate] = 0;
      tvaMap[rate] += l.totalLigne * (parseFloat(rate)/100);
    }
    for (const [rate, amount] of Object.entries(tvaMap)) {
      doc.setTextColor(100, 116, 139);
      doc.text(`TVA (${rate}%)`, 125, y);
      doc.setTextColor(15, 23, 42);
      doc.text(`${amount.toFixed(2)}€`, pageWidth - 20, y, { align: "right" });
      y += 8;
    }
    y -= 8; // Adjust to prevent double increment
  } else {
    doc.setTextColor(100, 116, 139);
    doc.text(`TVA (${data.tva})`, 125, y);
    doc.setTextColor(15, 23, 42);
    const tvaAmount = (parseFloat(data.totalTTC) - parseFloat(data.totalHT)).toFixed(2);
    doc.text(`${tvaAmount}€`, pageWidth - 20, y, { align: "right" });
  }

  y += 12;
  doc.setFillColor(color.r, color.g, color.b);
  doc.roundedRect(120, y - 7, pageWidth - 135, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total TTC", 125, y + 2);
  doc.text(`${data.totalTTC}€`, pageWidth - 22, y + 2, { align: "right" });

  if (data.acompte && parseFloat(data.acompte) > 0) {
    const acomptePct = parseFloat(data.acompte);
    const totalTTCNum = parseFloat(data.totalTTC);
    const acompteVal = (totalTTCNum * acomptePct / 100).toFixed(2);
    const resteVal = (totalTTCNum - parseFloat(acompteVal)).toFixed(2);
    
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Acompte demandé (${acomptePct}%)`, 125, y);
    doc.setTextColor(15, 23, 42);
    doc.text(`${acompteVal}€`, pageWidth - 20, y, { align: "right" });

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Reste à payer", 125, y);
    doc.text(`${resteVal}€`, pageWidth - 20, y, { align: "right" });
  }

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
  const footerLinesDevis = [];
  if (data.entreprise?.statut) footerLinesDevis.push(data.entreprise.statut);
  if (data.entreprise?.assurance) footerLinesDevis.push(data.entreprise.assurance);
  if (data.entreprise?.legal) footerLinesDevis.push(data.entreprise.legal);
  if (data.tva === "0" || data.tva === "0%") footerLinesDevis.push("TVA non applicable, art. 293 B du CGI.");
  if (!data.isPro) footerLinesDevis.push("Document gratuit généré par Zolio · zolio.site");
  footerLinesDevis.push("Ce devis est valable 30 jours à compter de sa date d'émission.");

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  
  let currentFooterYDevis = doc.internal.pageSize.getHeight() - 8 - (footerLinesDevis.length * 4);
  for (const line of footerLinesDevis) {
    const splitLine = doc.splitTextToSize(line, pageWidth - 40);
    doc.text(splitLine, pageWidth / 2, currentFooterYDevis, { align: "center" });
    currentFooterYDevis += splitLine.length * 4;
  }

  // Retourner un Buffer
  
  
  // === WATERMARK ===
  if (data.statut === "Refusé") {
    drawWatermark(doc, "REFUSÉ", { r: 239, g: 68, b: 68 });
  } else if (data.signatureBase64 || data.statut === "Accepté") {
    drawWatermark(doc, "BON POUR ACCORD", { r: 34, g: 197, b: 94 });
  } else if (data.statut === "En attente" || data.statut === "Brouillon") {
    drawWatermark(doc, "BROUILLON", { r: 148, g: 163, b: 184 });
  }

  // === CGV ANNEXE ===
  if (data.entreprise?.cgv) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Conditions Générales de Vente", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const splitCgv = doc.splitTextToSize(data.entreprise.cgv, pageWidth - 40);
    doc.text(splitCgv, 20, 35);
  }

  // === PHOTOS ANNEXE ===
  if (data.photos && data.photos.length > 0) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Annexe : Photos du chantier", 20, 20);

    let imgY = 30;
    for (const photo of data.photos) {
      if (imgY > 200) {
        doc.addPage();
        imgY = 20;
      }
      try {
        doc.addImage(photo, "JPEG", 20, imgY, 170, 100);
        imgY += 110;
      } catch (e) {
        console.error("Erreur d'ajout de photo:", e);
      }
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export async function generateFacturePDF(data: DevisData): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // === HEADER ===
  const color = hexToRgb(data.entreprise?.color || "#0ea5e9");
  
  // Ligne de couleur en haut
  doc.setFillColor(color.r, color.g, color.b);
  doc.rect(0, 0, pageWidth, 8, "F");

  let logoWidth = 0;
  if (data.entreprise?.logo) {
    const logoBase64 = await fetchImageAsBase64(data.entreprise.logo);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 15, 15, 25, 25);
        logoWidth = 30; // décalage pour le texte
      } catch (e) {
        console.error("Erreur ajout logo:", e);
      }
    }
  }

  doc.setTextColor(15, 23, 42); // Dark slate
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text((data.entreprise?.nom || "MON ENTREPRISE").toUpperCase(), 20 + logoWidth, 28);

  doc.setTextColor(100, 116, 139); // Slate gray
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Facture", 20 + logoWidth, 36);

  // Numéro et date à droite
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.numeroDevis, pageWidth - 20, 28, { align: "right" });
  
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date d'émission : ${data.date}`, pageWidth - 20, 36, { align: "right" });

  // === INFORMATIONS ===
  doc.setFillColor(248, 250, 252); // très léger gris
  doc.roundedRect(15, 48, 85, 45, 3, 3, "F");
  doc.roundedRect(110, 48, 85, 45, 3, 3, "F");

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("ÉMETTEUR", 20, 56);
  doc.text("CLIENT", 115, 56);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Émetteur
  if (data.entreprise) {
    let currentY = 65;
    doc.setFont("helvetica", "bold");
    doc.text(data.entreprise.nom, 20, currentY); currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.text(data.entreprise.email, 20, currentY); currentY += 5;
    if (data.entreprise.telephone) { doc.text(`Tél: ${data.entreprise.telephone}`, 20, currentY); currentY += 5; }
    if (data.entreprise.siret) { doc.text(`SIRET: ${data.entreprise.siret}`, 20, currentY); currentY += 5; }
    if (data.entreprise.adresse) {
      const splitAdresse = doc.splitTextToSize(data.entreprise.adresse, 75);
      doc.text(splitAdresse, 20, currentY);
    }
  } else {
    doc.text("Mon Entreprise", 20, 65);
  }

  // Client
  doc.setFont("helvetica", "bold");
  doc.text(data.client.nom, 115, 65);
  doc.setFont("helvetica", "normal");
  doc.text(data.client.email, 115, 71);
  if (data.client.telephone) doc.text(`Tél: ${data.client.telephone}`, 115, 76);
  if (data.client.adresse) {
    const splitAdresse = doc.splitTextToSize(data.client.adresse, 75);
    doc.text(splitAdresse, 115, 81);
  }

  // === TABLE HEADER ===
  let y = 105;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y - 5, pageWidth - 30, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Prestation", 20, y);
  doc.text("Qté", 100, y);
  doc.text("Unité", 115, y);
  doc.text("TVA", 130, y);
  doc.text("P.U. HT", 150, y, { align: "right" });
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
    doc.text(String(ligne.quantite), 102, y + 2);
    doc.text(ligne.unite, 115, y + 2);
    doc.text(ligne.tva ? `${ligne.tva}%` : (data.tva !== "Multi" ? data.tva : "20%"), 130, y + 2);
    doc.text(`${ligne.prixUnitaire.toFixed(2)}€`, 150, y + 2, { align: "right" });
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
  
  doc.text(data.remise ? "Total HT (avant remise)" : "Total HT", 125, y);
  doc.setTextColor(15, 23, 42);
  
  // Le totalHT reçu est APRÈS remise, on doit calculer le HT avant remise pour l'affichage si remise existe
  let htAffiche = data.totalHT;
  if (data.remise && parseFloat(data.remise) > 0) {
     const remisePct = parseFloat(data.remise);
     const htBase = parseFloat(data.totalHT) / (1 - remisePct / 100);
     htAffiche = htBase.toFixed(2);
  }
  
  doc.text(`${htAffiche}€`, pageWidth - 20, y, { align: "right" });
  
  if (data.remise && parseFloat(data.remise) > 0) {
     y += 8;
     doc.setTextColor(100, 116, 139);
     doc.text(`Remise (${data.remise}%)`, 125, y);
     doc.setTextColor(16, 185, 129); // emerald
     const remiseVal = (parseFloat(htAffiche) - parseFloat(data.totalHT)).toFixed(2);
     doc.text(`-${remiseVal}€`, pageWidth - 20, y, { align: "right" });
  }

  y += 8;

  doc.setTextColor(100, 116, 139);
  if (data.tva === "Multi") {
    // Calculate TVAs per rate
    const tvaMap: Record<string, number> = {};
    for (const l of data.lignes) {
      const rate = l.tva || "20";
      if (!tvaMap[rate]) tvaMap[rate] = 0;
      tvaMap[rate] += l.totalLigne * (parseFloat(rate)/100);
    }
    for (const [rate, amount] of Object.entries(tvaMap)) {
      doc.setTextColor(100, 116, 139);
      doc.text(`TVA (${rate}%)`, 125, y);
      doc.setTextColor(15, 23, 42);
      doc.text(`${amount.toFixed(2)}€`, pageWidth - 20, y, { align: "right" });
      y += 8;
    }
    y -= 8; // Adjust to prevent double increment
  } else {
    doc.setTextColor(100, 116, 139);
    doc.text(`TVA (${data.tva})`, 125, y);
    doc.setTextColor(15, 23, 42);
    const tvaAmount = (parseFloat(data.totalTTC) - parseFloat(data.totalHT)).toFixed(2);
    doc.text(`${tvaAmount}€`, pageWidth - 20, y, { align: "right" });
  }

  y += 12;
  doc.setFillColor(color.r, color.g, color.b); // Emerald green for Invoice
  doc.roundedRect(120, y - 7, pageWidth - 135, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total TTC", 125, y + 2);
  doc.text(`${data.totalTTC}€`, pageWidth - 22, y + 2, { align: "right" });

  if (data.acompte && parseFloat(data.acompte) > 0) {
    const acomptePct = parseFloat(data.acompte);
    const totalTTCNum = parseFloat(data.totalTTC);
    const acompteVal = (totalTTCNum * acomptePct / 100).toFixed(2);
    const resteVal = (totalTTCNum - parseFloat(acompteVal)).toFixed(2);
    
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Acompte versé (${acomptePct}%)`, 125, y);
    doc.setTextColor(15, 23, 42);
    doc.text(`${acompteVal}€`, pageWidth - 20, y, { align: "right" });

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Net à payer", 125, y);
    doc.text(`${resteVal}€`, pageWidth - 20, y, { align: "right" });
  }

  // === FOOTER ===
  const footerLinesFacture = [];
  if (data.entreprise?.statut) footerLinesFacture.push(data.entreprise.statut);
  if (data.entreprise?.assurance) footerLinesFacture.push(data.entreprise.assurance);
  if (data.entreprise?.legal) footerLinesFacture.push(data.entreprise.legal);
  if (data.tva === "0" || data.tva === "0%") footerLinesFacture.push("TVA non applicable, art. 293 B du CGI.");
  if (!data.isPro) footerLinesFacture.push("Document gratuit généré par Zolio · zolio.site");
  footerLinesFacture.push("En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.");

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  
  let currentFooterYFacture = doc.internal.pageSize.getHeight() - 8 - (footerLinesFacture.length * 4);
  for (const line of footerLinesFacture) {
    const splitLine = doc.splitTextToSize(line, pageWidth - 40);
    doc.text(splitLine, pageWidth / 2, currentFooterYFacture, { align: "center" });
    currentFooterYFacture += splitLine.length * 4;
  }

  // Retourner un Buffer
  
  
  // === WATERMARK ===
  if (data.statut === "Payé" || data.statut === "Payée") {
    drawWatermark(doc, "PAYÉ", { r: 34, g: 197, b: 94 });
  } else if (data.statut === "Brouillon") {
    drawWatermark(doc, "BROUILLON", { r: 148, g: 163, b: 184 });
  }

  // === CGV ANNEXE ===
  if (data.entreprise?.cgv) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Conditions Générales de Vente", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const splitCgv = doc.splitTextToSize(data.entreprise.cgv, pageWidth - 40);
    doc.text(splitCgv, 20, 35);
  }

  return Buffer.from(doc.output("arraybuffer"));

}
