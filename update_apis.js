const fs = require('fs');

const files = [
  'src/app/api/devis/route.ts',
  'src/app/api/devis/[numero]/route.ts',
  'src/app/api/factures/route.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');

    // 1. Extract new metadata fields
    content = content.replace(
      'const entrepriseSiret = meta.companySiret || "";',
      `const entrepriseSiret = meta.companySiret || "";
    const entrepriseColor = meta.companyColor || "";
    const entrepriseLogo = meta.companyLogo || "";
    const entrepriseIban = meta.companyIban || "";
    const entrepriseBic = meta.companyBic || "";
    const entrepriseLegal = meta.companyLegal || "";`
    );

    // 2. Add them to entreprise object in PDF generation
    content = content.replace(
      'entreprise: { nom: entrepriseName, email: entrepriseEmail, telephone: entreprisePhone, adresse: entrepriseAddress, siret: entrepriseSiret },',
      'entreprise: { nom: entrepriseName, email: entrepriseEmail, telephone: entreprisePhone, adresse: entrepriseAddress, siret: entrepriseSiret, color: entrepriseColor, logo: entrepriseLogo, iban: entrepriseIban, bic: entrepriseBic, legal: entrepriseLegal },'
    );
    
    fs.writeFileSync(file, content);
  }
});
