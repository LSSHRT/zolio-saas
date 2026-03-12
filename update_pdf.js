const fs = require('fs');

let content = fs.readFileSync('src/lib/generatePdf.ts', 'utf-8');

// Add fields to interface
content = content.replace(
  'entreprise?: { nom: string; email: string; telephone?: string; adresse?: string; siret?: string; };',
  'entreprise?: { nom: string; email: string; telephone?: string; adresse?: string; siret?: string; color?: string; logo?: string; iban?: string; bic?: string; legal?: string; };'
);

// Add hexToRgb function at top
content = content.replace(
  'import { jsPDF } from "jspdf";',
  `import { jsPDF } from "jspdf";

function hexToRgb(hex: string) {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 14, g: 165, b: 233 };
}`
);

// --- DEVIS ---

// Change header color in Devis
content = content.replace(
  'doc.setFillColor(14, 165, 233); // Primary blue',
  `const color = hexToRgb(data.entreprise?.color || "#0ea5e9");
  doc.setFillColor(color.r, color.g, color.b);`
);

// Change Total TTC color in Devis
content = content.replace(
  'doc.setFillColor(14, 165, 233);',
  `doc.setFillColor(color.r, color.g, color.b);`
);

// Add signature block in Devis
content = content.replace(
  '// === FOOTER ===',
  `// === SIGNATURE ===
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Date et signature précédées de la mention 'Bon pour accord'", 20, y + 25);
  doc.setDrawColor(203, 213, 225);
  doc.rect(20, y + 30, 80, 25);

  // === FOOTER ===`
);

// Add legal mention in Devis
content = content.replace(
  'doc.text("Devis généré automatiquement par Zolio · zolio.site", pageWidth / 2, footerY, { align: "center" });',
  `if (data.entreprise?.legal) {
    doc.text(data.entreprise.legal, pageWidth / 2, footerY - 5, { align: "center" });
  }
  doc.text("Devis généré automatiquement par Zolio · zolio.site", pageWidth / 2, footerY, { align: "center" });`
);


// --- FACTURE ---

// Change header color in Facture
content = content.replace(
  'doc.setFillColor(16, 185, 129); // Emerald green for Invoice',
  `const color = hexToRgb(data.entreprise?.color || "#0ea5e9");
  doc.setFillColor(color.r, color.g, color.b);`
);

// Change Total TTC color in Facture
// There's a setFillColor(16, 185, 129) in Facture Total TTC. Wait, we must make sure it replaces the correct one.
// The file has a second setFillColor for Total TTC. We'll use a regex for replacing the green one.
content = content.replace(
  /doc\.setFillColor\(16, 185, 129\);/g,
  `doc.setFillColor(color.r, color.g, color.b);`
);

// Add IBAN block in Facture
content = content.replace(
  '// === FOOTER ===\n  const footerY = doc.internal.pageSize.getHeight() - 20;',
  `// === COORDONNÉES BANCAIRES ===
  if (data.entreprise?.iban) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Coordonnées bancaires pour le règlement :", 20, y + 25);
    doc.setFont("helvetica", "normal");
    doc.text(\`IBAN : \${data.entreprise.iban}\`, 20, y + 32);
    if (data.entreprise.bic) {
      doc.text(\`BIC : \${data.entreprise.bic}\`, 20, y + 38);
    }
  }

  // === FOOTER ===
  const footerY = doc.internal.pageSize.getHeight() - 20;`
);

// Add legal mention in Facture
content = content.replace(
  'doc.text("Facture générée automatiquement par Zolio · zolio.site", pageWidth / 2, footerY, { align: "center" });',
  `if (data.entreprise?.legal) {
    doc.text(data.entreprise.legal, pageWidth / 2, footerY - 5, { align: "center" });
  }
  doc.text("Facture générée automatiquement par Zolio · zolio.site", pageWidth / 2, footerY, { align: "center" });`
);

fs.writeFileSync('src/lib/generatePdf.ts', content);
