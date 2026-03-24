const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

const models = ['Client', 'Prestation', 'Depense', 'Note'];

models.forEach(model => {
  const regex = new RegExp(`model ${model} \\{[\\s\\S]*?userId\\s+String[\\s\\S]*?\\n\\}`, 'g');
  content = content.replace(regex, match => {
    return match.replace(/\n\}$/, '\n\n  @@index([userId])\n}');
  });
});

fs.writeFileSync('prisma/schema.prisma', content);
