import { jsPDF } from "jspdf";
import { fetchRemoteImageAsDataUrl } from "@/lib/remote-image";

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface LigneDevis {
  nomPrestation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  totalLigne: number;
  tva?: string;
  isOptional?: boolean;
}

interface DevisData {
  numeroDevis: string;
  date: string;
  client: {
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
  };
  isPro?: boolean;
  acompte?: string;
  remise?: string;
  entreprise?: {
    nom: string;
    email: string;
    telephone?: string;
    adresse?: string;
    siret?: string;
    color?: string;
    logo?: string;
    iban?: string;
    bic?: string;
    legal?: string;
    cgv?: string;
    statut?: string;
    assurance?: string;
  };
  signatureBase64?: string;
  statut?: string;
  lignes: LigneDevis[];
  totalHT: string;
  tva: string;
  totalTTC: string;
  photos?: string[];
}

type PdfDoc = jsPDF;

type TextLineStyle = "normal" | "bold" | "muted" | "accent";

interface TextLine {
  text: string;
  style?: TextLineStyle;
}

interface PdfPalette {
  accent: RgbColor;
  accentDark: RgbColor;
  accentSoft: RgbColor;
  accentMuted: RgbColor;
  surface: RgbColor;
  white: RgbColor;
  border: RgbColor;
  text: RgbColor;
  muted: RgbColor;
  softText: RgbColor;
  success: RgbColor;
}

interface SummaryRow {
  label: string;
  value: string;
  tone?: "default" | "positive";
}

interface SummaryData {
  rows: SummaryRow[];
  totalLabel: string;
  totalValue: string;
  secondaryLabel?: string;
  secondaryValue?: string;
}

interface DocumentOptions {
  title: string;
  subjectLabel: string;
  footerNote: string;
  paymentHint: string;
  upfrontLabel: string;
  balanceLabel: string;
  includeSignature: boolean;
  includePhotos: boolean;
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;

  try {
    return await fetchRemoteImageAsDataUrl(url);
  } catch (error) {
    console.error("Erreur de récupération du logo:", error);
    return null;
  }
}

function hexToRgb(hex: string): RgbColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 14, g: 165, b: 233 };
}

function mixWithWhite(color: RgbColor, amount: number): RgbColor {
  const ratio = Math.min(Math.max(amount, 0), 1);

  return {
    r: Math.round(color.r + (255 - color.r) * ratio),
    g: Math.round(color.g + (255 - color.g) * ratio),
    b: Math.round(color.b + (255 - color.b) * ratio),
  };
}

function darken(color: RgbColor, amount: number): RgbColor {
  const ratio = Math.min(Math.max(amount, 0), 1);

  return {
    r: Math.round(color.r * (1 - ratio)),
    g: Math.round(color.g * (1 - ratio)),
    b: Math.round(color.b * (1 - ratio)),
  };
}

function buildPalette(color: RgbColor): PdfPalette {
  return {
    accent: color,
    accentDark: darken(color, 0.22),
    accentSoft: mixWithWhite(color, 0.9),
    accentMuted: mixWithWhite(color, 0.72),
    surface: { r: 248, g: 250, b: 252 },
    white: { r: 255, g: 255, b: 255 },
    border: { r: 226, g: 232, b: 240 },
    text: { r: 15, g: 23, b: 42 },
    muted: { r: 100, g: 116, b: 139 },
    softText: { r: 148, g: 163, b: 184 },
    success: { r: 16, g: 185, b: 129 },
  };
}

function setFillColor(doc: PdfDoc, color: RgbColor) {
  doc.setFillColor(color.r, color.g, color.b);
}

function setTextColor(doc: PdfDoc, color: RgbColor) {
  doc.setTextColor(color.r, color.g, color.b);
}

function setDrawColor(doc: PdfDoc, color: RgbColor) {
  doc.setDrawColor(color.r, color.g, color.b);
}

function safeNumber(value: string | number | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const normalized = String(value).replace(",", ".");
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: string | number): string {
  return `${safeNumber(value).toFixed(2)}€`;
}

function guessImageFormat(image: string): "PNG" | "JPEG" {
  if (image.startsWith("data:image/png")) {
    return "PNG";
  }

  return "JPEG";
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

function drawWatermark(doc: PdfDoc, text: string, color: RgbColor) {
  doc.saveGraphicsState();
  doc.setGState(new (doc as unknown as { GState: new (options: { opacity: number }) => unknown }).GState({ opacity: 0.07 }));
  setTextColor(doc, color);
  doc.setFontSize(38);
  doc.setFont("helvetica", "bold");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.text(text, pageWidth / 2, pageHeight * 0.56, {
    angle: 36,
    align: "center",
    baseline: "middle",
  });
  doc.restoreGraphicsState();
}

function buildCompanyLines(doc: PdfDoc, data: DevisData, maxWidth: number): TextLine[] {
  const lines: TextLine[] = [];

  if (data.entreprise?.nom) {
    lines.push({ text: data.entreprise.nom, style: "bold" });
  }

  if (data.entreprise?.email) {
    lines.push({ text: data.entreprise.email });
  }

  if (data.entreprise?.telephone) {
    lines.push({ text: `Tél. ${data.entreprise.telephone}` });
  }

  if (data.entreprise?.siret) {
    lines.push({ text: `SIRET ${data.entreprise.siret}` });
  }

  if (data.entreprise?.adresse) {
    for (const addressLine of doc.splitTextToSize(data.entreprise.adresse, maxWidth) as string[]) {
      lines.push({ text: addressLine });
    }
  }

  if (lines.length === 0) {
    lines.push({ text: "Mon Entreprise", style: "bold" });
  }

  return lines;
}

function buildClientLines(doc: PdfDoc, data: DevisData, maxWidth: number): TextLine[] {
  const lines: TextLine[] = [];

  if (data.client.nom) {
    lines.push({ text: data.client.nom, style: "bold" });
  }

  if (data.client.email) {
    lines.push({ text: data.client.email });
  }

  if (data.client.telephone) {
    lines.push({ text: `Tél. ${data.client.telephone}` });
  }

  if (data.client.adresse) {
    for (const addressLine of doc.splitTextToSize(data.client.adresse, maxWidth) as string[]) {
      lines.push({ text: addressLine });
    }
  }

  return lines;
}

function getInfoCardHeight(lines: TextLine[]): number {
  return 20 + lines.length * 5.2;
}

function drawInfoCard(
  doc: PdfDoc,
  palette: PdfPalette,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  lines: TextLine[],
) {
  setFillColor(doc, palette.white);
  setDrawColor(doc, palette.border);
  doc.roundedRect(x, y, width, height, 6, 6, "FD");

  setTextColor(doc, palette.accentDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(title.toUpperCase(), x + 7, y + 9);

  setDrawColor(doc, palette.accentMuted);
  doc.setLineWidth(0.5);
  doc.line(x + 7, y + 12.5, x + width - 7, y + 12.5);

  let currentY = y + 19;
  doc.setFontSize(10);

  for (const line of lines) {
    if (line.style === "bold") {
      doc.setFont("helvetica", "bold");
      setTextColor(doc, palette.text);
    } else if (line.style === "accent") {
      doc.setFont("helvetica", "bold");
      setTextColor(doc, palette.accentDark);
    } else if (line.style === "muted") {
      doc.setFont("helvetica", "normal");
      setTextColor(doc, palette.softText);
    } else {
      doc.setFont("helvetica", "normal");
      setTextColor(doc, palette.text);
    }

    doc.text(line.text, x + 7, currentY);
    currentY += 5.2;
  }
}

function drawHeaderMetaCard(
  doc: PdfDoc,
  palette: PdfPalette,
  x: number,
  y: number,
  width: number,
  title: string,
  documentNumber: string,
  date: string,
) {
  setFillColor(doc, palette.accentSoft);
  setDrawColor(doc, palette.accentMuted);
  doc.roundedRect(x, y, width, 32, 7, 7, "FD");

  setTextColor(doc, palette.accentDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(title.toUpperCase(), x + 6, y + 8);

  setTextColor(doc, palette.text);
  doc.setFontSize(14);
  doc.text(documentNumber, x + 6, y + 17);

  setTextColor(doc, palette.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Émis le ${date}`, x + 6, y + 25);
}

function drawFirstPageHeader(
  doc: PdfDoc,
  data: DevisData,
  options: DocumentOptions,
  palette: PdfPalette,
  logoBase64: string | null,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  setFillColor(doc, palette.accent);
  doc.rect(0, 0, pageWidth, 10, "F");

  let brandX = 16;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 16, 17, 24, 24);
      brandX = 46;
    } catch (error) {
      console.error("Erreur ajout logo:", error);
    }
  }

  setTextColor(doc, palette.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text((data.entreprise?.nom || "MON ENTREPRISE").toUpperCase(), brandX, 25);

  setTextColor(doc, palette.accentDark);
  doc.setFontSize(10);
  doc.text(options.title.toUpperCase(), brandX, 32);

  setTextColor(doc, palette.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(options.subjectLabel, brandX, 38);

  drawHeaderMetaCard(doc, palette, pageWidth - 74, 16, 58, options.title, data.numeroDevis, data.date);

  setDrawColor(doc, palette.border);
  doc.setLineWidth(0.6);
  doc.line(16, 49, pageWidth - 16, 49);

  return 58;
}

function drawContinuationHeader(
  doc: PdfDoc,
  data: DevisData,
  options: DocumentOptions,
  palette: PdfPalette,
  label: string,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  setFillColor(doc, palette.accent);
  doc.rect(0, 0, pageWidth, 8, "F");

  setTextColor(doc, palette.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`${options.title} ${data.numeroDevis}`, 16, 20);

  setTextColor(doc, palette.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(label, pageWidth - 16, 20, { align: "right" });

  setDrawColor(doc, palette.border);
  doc.setLineWidth(0.6);
  doc.line(16, 26, pageWidth - 16, 26);

  return 34;
}

function drawSectionHeading(doc: PdfDoc, palette: PdfPalette, y: number, title: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  setTextColor(doc, palette.accentDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(title.toUpperCase(), 16, y);

  setDrawColor(doc, palette.accentMuted);
  doc.setLineWidth(0.5);
  doc.line(42, y - 1.4, pageWidth - 16, y - 1.4);

  return y + 6;
}

function drawTableHeader(doc: PdfDoc, palette: PdfPalette, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth();

  setFillColor(doc, palette.surface);
  setDrawColor(doc, palette.border);
  doc.roundedRect(16, y, pageWidth - 32, 12, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  setTextColor(doc, palette.muted);
  doc.text("Prestation", 20, y + 7.5);
  doc.text("Qté", 109, y + 7.5, { align: "center" });
  doc.text("Unité", 124, y + 7.5, { align: "center" });
  doc.text("TVA", 139, y + 7.5, { align: "center" });
  doc.text("P.U. HT", 160, y + 7.5, { align: "right" });
  doc.text("Total HT", pageWidth - 18, y + 7.5, { align: "right" });
}

function drawTableRow(
  doc: PdfDoc,
  palette: PdfPalette,
  y: number,
  rowHeight: number,
  index: number,
  ligne: LigneDevis,
  descriptionLines: string[],
  tvaLabel: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rowTop = y;
  const rowWidth = pageWidth - 32;
  const rowBackground = index % 2 === 0 ? palette.white : palette.surface;
  const middleY = rowTop + rowHeight / 2 + 1;
  const label = ligne.isOptional ? "Option" : "Prestation";

  setFillColor(doc, rowBackground);
  setDrawColor(doc, palette.border);
  doc.roundedRect(16, rowTop, rowWidth, rowHeight, 4, 4, "FD");

  setFillColor(doc, ligne.isOptional ? palette.surface : palette.accentSoft);
  doc.roundedRect(20, rowTop + 4, 22, 6, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setTextColor(doc, ligne.isOptional ? palette.muted : palette.accentDark);
  doc.text(label.toUpperCase(), 31, rowTop + 8.4, { align: "center" });

  setTextColor(doc, ligne.isOptional ? palette.muted : palette.text);
  doc.setFont("helvetica", ligne.isOptional ? "italic" : "bold");
  doc.setFontSize(10);
  doc.text(descriptionLines, 20, rowTop + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(String(ligne.quantite), 109, middleY, { align: "center" });
  doc.text(truncateText(ligne.unite || "-", 12), 124, middleY, { align: "center" });
  doc.text(tvaLabel, 139, middleY, { align: "center" });
  doc.text(formatCurrency(ligne.prixUnitaire || 0), 160, middleY, { align: "right" });

  doc.setFont("helvetica", "bold");
  setTextColor(doc, ligne.isOptional ? palette.muted : palette.text);
  doc.text(formatCurrency(ligne.totalLigne || 0), pageWidth - 18, middleY, { align: "right" });
}

function buildSummaryData(data: DevisData, options: DocumentOptions): SummaryData {
  const rows: SummaryRow[] = [];
  const remise = safeNumber(data.remise);
  const acompte = safeNumber(data.acompte);
  const totalHT = safeNumber(data.totalHT);
  const totalTTC = safeNumber(data.totalTTC);
  const totalHTBeforeDiscount = remise > 0 && remise < 100 ? totalHT / (1 - remise / 100) : totalHT;

  rows.push({
    label: remise > 0 ? "Total HT avant remise" : "Total HT",
    value: formatCurrency(totalHTBeforeDiscount),
  });

  if (remise > 0) {
    rows.push({
      label: `Remise (${remise.toFixed(remise % 1 === 0 ? 0 : 2)}%)`,
      value: `-${formatCurrency(totalHTBeforeDiscount - totalHT)}`,
      tone: "positive",
    });
  }

  if (data.tva === "Multi") {
    const tvaMap = new Map<string, number>();

    for (const ligne of data.lignes) {
      if (ligne.isOptional) continue;
      const rate = ligne.tva || "20";
      tvaMap.set(rate, (tvaMap.get(rate) || 0) + ligne.totalLigne * (safeNumber(rate) / 100));
    }

    for (const [rate, amount] of [...tvaMap.entries()].sort(([a], [b]) => safeNumber(a) - safeNumber(b))) {
      rows.push({
        label: `TVA (${rate}%)`,
        value: formatCurrency(amount),
      });
    }
  } else {
    rows.push({
      label: `TVA (${data.tva})`,
      value: formatCurrency(totalTTC - totalHT),
    });
  }

  const summary: SummaryData = {
    rows,
    totalLabel: "Total TTC",
    totalValue: formatCurrency(totalTTC),
  };

  if (acompte > 0) {
    const upfrontValue = totalTTC * acompte / 100;
    const balanceValue = totalTTC - upfrontValue;
    summary.rows.push({
      label: `${options.upfrontLabel} (${acompte.toFixed(acompte % 1 === 0 ? 0 : 2)}%)`,
      value: formatCurrency(upfrontValue),
    });
    summary.secondaryLabel = options.balanceLabel;
    summary.secondaryValue = formatCurrency(balanceValue);
  }

  return summary;
}

function getSummaryCardHeight(summary: SummaryData): number {
  const baseRowsHeight = summary.rows.length * 8;
  const secondaryHeight = summary.secondaryLabel ? 15 : 0;
  return 22 + baseRowsHeight + 18 + secondaryHeight;
}

function drawSummaryCard(
  doc: PdfDoc,
  palette: PdfPalette,
  x: number,
  y: number,
  width: number,
  summary: SummaryData,
) {
  const height = getSummaryCardHeight(summary);

  setFillColor(doc, palette.white);
  setDrawColor(doc, palette.border);
  doc.roundedRect(x, y, width, height, 7, 7, "FD");

  setTextColor(doc, palette.accentDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("RÉCAPITULATIF", x + 8, y + 10);

  let currentY = y + 18;
  doc.setFontSize(10);

  for (const row of summary.rows) {
    doc.setFont("helvetica", "normal");
    setTextColor(doc, palette.muted);
    doc.text(row.label, x + 8, currentY);

    doc.setFont("helvetica", row.tone === "positive" ? "bold" : "normal");
    setTextColor(doc, row.tone === "positive" ? palette.success : palette.text);
    doc.text(row.value, x + width - 8, currentY, { align: "right" });
    currentY += 8;
  }

  setFillColor(doc, palette.accent);
  doc.roundedRect(x + 6, currentY - 1, width - 12, 16, 5, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setTextColor(doc, palette.white);
  doc.text(summary.totalLabel, x + 10, currentY + 9);
  doc.text(summary.totalValue, x + width - 10, currentY + 9, { align: "right" });
  currentY += 23;

  if (summary.secondaryLabel && summary.secondaryValue) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTextColor(doc, palette.text);
    doc.text(summary.secondaryLabel, x + 8, currentY);
    setTextColor(doc, palette.accentDark);
    doc.text(summary.secondaryValue, x + width - 8, currentY, { align: "right" });
  }

  return height;
}

function buildInfoPanel(data: DevisData, options: DocumentOptions): { title: string; lines: TextLine[] } {
  const lines: TextLine[] = [];

  if (data.entreprise?.iban) {
    lines.push({ text: options.paymentHint, style: "muted" });
    lines.push({ text: `IBAN : ${data.entreprise.iban}` });
    if (data.entreprise.bic) {
      lines.push({ text: `BIC : ${data.entreprise.bic}` });
    }
    lines.push({ text: `Référence : ${data.numeroDevis}`, style: "muted" });
    return { title: "Règlement", lines };
  }

  lines.push({ text: options.paymentHint, style: "muted" });
  lines.push({
    text: options.title === "Devis"
      ? "Coordonnées bancaires disponibles sur demande."
      : "Règlement à réception avec la référence de facture.",
  });

  return { title: "Informations", lines };
}

function getNoteCardHeight(lines: TextLine[]): number {
  return 22 + lines.length * 5.2;
}

function drawNoteCard(
  doc: PdfDoc,
  palette: PdfPalette,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  lines: TextLine[],
) {
  setFillColor(doc, palette.surface);
  setDrawColor(doc, palette.border);
  doc.roundedRect(x, y, width, height, 7, 7, "FD");

  setTextColor(doc, palette.accentDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(title.toUpperCase(), x + 8, y + 10);

  let currentY = y + 18;
  doc.setFontSize(10);

  for (const line of lines) {
    if (line.style === "muted") {
      doc.setFont("helvetica", "normal");
      setTextColor(doc, palette.muted);
    } else if (line.style === "bold") {
      doc.setFont("helvetica", "bold");
      setTextColor(doc, palette.text);
    } else {
      doc.setFont("helvetica", "normal");
      setTextColor(doc, palette.text);
    }

    doc.text(line.text, x + 8, currentY);
    currentY += 5.2;
  }
}

function drawSignatureCard(doc: PdfDoc, palette: PdfPalette, data: DevisData, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const x = 16;
  const width = pageWidth - 32;
  const height = 50;

  setFillColor(doc, palette.white);
  setDrawColor(doc, palette.border);
  doc.roundedRect(x, y, width, height, 7, 7, "FD");

  setTextColor(doc, palette.accentDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ACCORD CLIENT", x + 8, y + 10);

  setTextColor(doc, palette.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text('Signature précédée de la mention "Bon pour accord"', x + 8, y + 20);

  setTextColor(doc, palette.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const instructionLines = doc.splitTextToSize(
    "Merci de dater et signer le document pour confirmer votre validation du devis.",
    92,
  ) as string[];
  doc.text(instructionLines, x + 8, y + 27);

  const signatureBoxX = pageWidth - 84;
  const signatureBoxY = y + 14;
  const signatureBoxWidth = 62;
  const signatureBoxHeight = 28;

  setFillColor(doc, palette.surface);
  setDrawColor(doc, palette.accentMuted);
  doc.roundedRect(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight, 5, 5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setTextColor(doc, palette.muted);
  doc.text(data.signatureBase64 ? "SIGNATURE ENREGISTRÉE" : "ZONE DE SIGNATURE", signatureBoxX + signatureBoxWidth / 2, signatureBoxY + 6, {
    align: "center",
  });

  if (data.signatureBase64 && data.signatureBase64.startsWith("data:image")) {
    try {
      doc.addImage(
        data.signatureBase64,
        guessImageFormat(data.signatureBase64),
        signatureBoxX + 4,
        signatureBoxY + 8,
        signatureBoxWidth - 8,
        signatureBoxHeight - 11,
      );
    } catch (error) {
      console.error("Erreur lors de l'ajout de la signature au PDF:", error);
    }
  }

  return height;
}

function buildFooterLines(data: DevisData, options: DocumentOptions): string[] {
  const footerLines: string[] = [];

  if (data.entreprise?.statut) footerLines.push(data.entreprise.statut);
  if (data.entreprise?.assurance) footerLines.push(data.entreprise.assurance);
  if (data.entreprise?.legal) footerLines.push(data.entreprise.legal);
  if (data.tva === "0" || data.tva === "0%") footerLines.push("TVA non applicable, art. 293 B du CGI.");
  if (!data.isPro) footerLines.push("Document généré avec la version d'essai de Zolio · zolio.site");
  footerLines.push(options.footerNote);

  return footerLines;
}

function drawFootersOnAllPages(
  doc: PdfDoc,
  palette: PdfPalette,
  footerLines: string[],
  title: string,
  documentNumber: string,
) {
  const totalPages = doc.getNumberOfPages();

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    doc.setPage(pageNumber);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const wrappedLines = footerLines.flatMap((line) => doc.splitTextToSize(line, pageWidth - 40) as string[]);
    const footerStartY = pageHeight - 10 - wrappedLines.length * 3.8;

    setDrawColor(doc, palette.border);
    doc.setLineWidth(0.5);
    doc.line(16, footerStartY - 8, pageWidth - 16, footerStartY - 8);

    setTextColor(doc, palette.softText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);

    wrappedLines.forEach((line, index) => {
      doc.text(line, pageWidth / 2, footerStartY + index * 3.8, { align: "center" });
    });

    doc.text(`${title} ${documentNumber} · Page ${pageNumber}/${totalPages}`, pageWidth - 16, footerStartY - 11, {
      align: "right",
    });
  }
}

function addAnnexHeader(
  doc: PdfDoc,
  palette: PdfPalette,
  options: DocumentOptions,
  data: DevisData,
  title: string,
  subtitle?: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  setFillColor(doc, palette.accent);
  doc.rect(0, 0, pageWidth, 8, "F");

  setTextColor(doc, palette.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, 16, 22);

  setTextColor(doc, palette.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${options.title} ${data.numeroDevis}`, pageWidth - 16, 20, { align: "right" });

  if (subtitle) {
    doc.text(subtitle, 16, 29);
  }

  setDrawColor(doc, palette.border);
  doc.setLineWidth(0.6);
  doc.line(16, 34, pageWidth - 16, 34);
}

function applyStatusWatermark(doc: PdfDoc, data: DevisData, options: DocumentOptions, pageCount: number) {
  let watermarkText: string | null = null;
  let watermarkColor: RgbColor | null = null;

  if (options.title === "Devis") {
    if (data.statut === "Refusé") {
      watermarkText = "REFUSÉ";
      watermarkColor = { r: 239, g: 68, b: 68 };
    } else if (data.signatureBase64 || data.statut === "Accepté") {
      watermarkText = "BON POUR ACCORD";
      watermarkColor = { r: 34, g: 197, b: 94 };
    } else if (data.statut === "En attente" || data.statut === "Brouillon") {
      watermarkText = "BROUILLON";
      watermarkColor = { r: 148, g: 163, b: 184 };
    }
  } else if (data.statut === "Payé" || data.statut === "Payée") {
    watermarkText = "PAYÉ";
    watermarkColor = { r: 34, g: 197, b: 94 };
  } else if (data.statut === "Brouillon") {
    watermarkText = "BROUILLON";
    watermarkColor = { r: 148, g: 163, b: 184 };
  }

  if (!watermarkText || !watermarkColor) {
    return;
  }

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber);
    drawWatermark(doc, watermarkText, watermarkColor);
  }
}

async function generateBusinessDocumentPDF(data: DevisData, options: DocumentOptions): Promise<Buffer> {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const palette = buildPalette(hexToRgb(data.entreprise?.color || "#0ea5e9"));
  const logoBase64 = data.entreprise?.logo ? await fetchImageAsBase64(data.entreprise.logo) : null;

  const companyLines = buildCompanyLines(doc, data, 74);
  const clientLines = buildClientLines(doc, data, 74);

  let y = drawFirstPageHeader(doc, data, options, palette, logoBase64);

  const companyCardHeight = getInfoCardHeight(companyLines);
  const clientCardHeight = getInfoCardHeight(clientLines);
  const cardHeight = Math.max(companyCardHeight, clientCardHeight, 42);

  drawInfoCard(doc, palette, 16, y, 86, cardHeight, "Émetteur", companyLines);
  drawInfoCard(doc, palette, 108, y, 86, cardHeight, "Client", clientLines);

  y += cardHeight + 14;
  y = drawSectionHeading(doc, palette, y, "Détail des prestations");
  drawTableHeader(doc, palette, y);
  y += 16;

  let rowIndex = 0;
  for (const ligne of data.lignes) {
    const description = `${ligne.nomPrestation}${ligne.isOptional ? " · Option" : ""}`;
    const descriptionLines = doc.splitTextToSize(description, 78) as string[];
    const rowHeight = Math.max(20, descriptionLines.length * 4.8 + 10);

    if (y + rowHeight > pageHeight - 54) {
      doc.addPage();
      y = drawContinuationHeader(doc, data, options, palette, "Suite du détail des prestations");
      drawTableHeader(doc, palette, y);
      y += 16;
    }

    const tvaLabel = ligne.tva ? `${ligne.tva}%` : (data.tva !== "Multi" ? data.tva : "20%");

    drawTableRow(doc, palette, y, rowHeight, rowIndex, ligne, descriptionLines, tvaLabel);
    y += rowHeight + 4;
    rowIndex += 1;
  }

  y += 8;

  const summary = buildSummaryData(data, options);
  const infoPanel = buildInfoPanel(data, options);
  const noteCardHeight = getNoteCardHeight(infoPanel.lines);
  const summaryCardHeight = getSummaryCardHeight(summary);
  const summaryBlockHeight = Math.max(noteCardHeight, summaryCardHeight);

  if (y + summaryBlockHeight > pageHeight - 72) {
    doc.addPage();
    y = drawContinuationHeader(doc, data, options, palette, "Synthèse du document");
  }

  drawNoteCard(doc, palette, 16, y, 86, noteCardHeight, infoPanel.title, infoPanel.lines);
  drawSummaryCard(doc, palette, 108, y, 86, summary);
  y += summaryBlockHeight + 14;

  if (options.includeSignature) {
    const signatureHeight = 50;
    if (y + signatureHeight > pageHeight - 54) {
      doc.addPage();
      y = drawContinuationHeader(doc, data, options, palette, "Validation du document");
    }

    drawSignatureCard(doc, palette, data, y);
    y += signatureHeight + 10;
  }

  const mainPageCount = doc.getNumberOfPages();
  applyStatusWatermark(doc, data, options, mainPageCount);

  if (data.entreprise?.cgv) {
    doc.addPage();
    addAnnexHeader(doc, palette, options, data, "Conditions générales de vente", "Annexe documentaire");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setTextColor(doc, palette.text);
    const splitCgv = doc.splitTextToSize(data.entreprise.cgv, 176) as string[];
    doc.text(splitCgv, 16, 44);
  }

  if (options.includePhotos && data.photos && data.photos.length > 0) {
    let photoY = 42;
    let photoPageInitialized = false;

    for (const [index, photo] of data.photos.entries()) {
      if (!photoPageInitialized || photoY > pageHeight - 90) {
        doc.addPage();
        addAnnexHeader(doc, palette, options, data, "Annexe photos", "Visuels joints au document");
        photoY = 42;
        photoPageInitialized = true;
      }

      setFillColor(doc, palette.surface);
      setDrawColor(doc, palette.border);
      doc.roundedRect(16, photoY, 178, 72, 6, 6, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setTextColor(doc, palette.muted);
      doc.text(`PHOTO ${index + 1}`, 24, photoY + 8);

      try {
        doc.addImage(photo, guessImageFormat(photo), 22, photoY + 12, 166, 54);
      } catch (error) {
        console.error("Erreur d'ajout de photo:", error);
      }

      photoY += 80;
    }
  }

  drawFootersOnAllPages(doc, palette, buildFooterLines(data, options), options.title, data.numeroDevis);

  return Buffer.from(doc.output("arraybuffer"));
}

export async function generateDevisPDF(data: DevisData): Promise<Buffer> {
  return generateBusinessDocumentPDF(data, {
    title: "Devis",
    subjectLabel: "Proposition commerciale",
    footerNote: "Ce devis est valable 30 jours à compter de sa date d'émission.",
    paymentHint: "Paiement par virement bancaire conseillé.",
    upfrontLabel: "Acompte demandé",
    balanceLabel: "Reste à payer",
    includeSignature: true,
    includePhotos: true,
  });
}

export async function generateFacturePDF(data: DevisData): Promise<Buffer> {
  return generateBusinessDocumentPDF(data, {
    title: "Facture",
    subjectLabel: "Document de facturation",
    footerNote: "En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.",
    paymentHint: "Merci d'indiquer la référence de facture lors du règlement.",
    upfrontLabel: "Acompte versé",
    balanceLabel: "Net à payer",
    includeSignature: false,
    includePhotos: false,
  });
}
