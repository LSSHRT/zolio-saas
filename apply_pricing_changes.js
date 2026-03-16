const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;
  
  for (const { search, replace } of replacements) {
    if (typeof search === 'string') {
      content = content.split(search).join(replace);
    } else {
      content = content.replace(search, replace);
    }
  }
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

replaceInFile('src/lib/sendEmail.ts', [
  { search: 'Découvrir Zolio gratuitement', replace: 'Découvrir Zolio' },
  { search: "Essayez dès maintenant, c'est gratuit et sans engagement.", replace: "Démarrez votre essai dès maintenant et simplifiez votre quotidien." }
]);

replaceInFile('src/components/LandingPage.tsx', [
  { search: 'Essayer gratuitement', replace: 'Essayer Zolio' },
  { search: "Démarrer l'essai gratuit", replace: "Démarrer l'essai" },
  { search: 'Créer mon compte gratuitement', replace: 'Créer mon compte' }
]);

replaceInFile('src/app/page.tsx', [
  { search: '`Essai : ${Math.min(devis.length, 3)}/3 gratuits`', replace: '`Essai : ${Math.min(devis.length, 1)}/1`' },
  { search: 'limite >= 3', replace: 'limite >= 1' },
  { search: '3 devis maximum en gratuit', replace: '1 devis maximum en essai' }
]);

replaceInFile('src/app/nouveau-devis/page.tsx', [
  { search: 'limite de 3 devis gratuits', replace: 'limite de 1 devis d\'essai' },
  { search: 'devis gratuits. Passez à la', replace: 'devis d\'essai. Passez à la' },
  { search: 'devis.length >= 3', replace: 'devis.length >= 1' }
]);

replaceInFile('src/app/parametres/page.tsx', [
  { search: '1 mois d\'abonnement gratuit', replace: '-50% sur votre prochain mois' },
  { search: '1 mois gratuit', replace: '-50% sur l\'abonnement' }
]);

replaceInFile('src/lib/generatePdf.ts', [
  { search: 'Document gratuit généré par Zolio', replace: 'Document généré avec la version d\'essai de Zolio' }
]);

console.log('All replacements processed.');
