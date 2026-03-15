const fs = require('fs');
const path = require('path');

const files = [
  'src/app/clients/page.tsx',
  'src/app/catalogue/page.tsx',
  'src/app/devis/page.tsx',
  'src/app/depenses/page.tsx',
  'src/app/planning/page.tsx'
];

const blobs = `      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-orange-400/4 dark:from-violet-600/15 dark:via-fuchsia-500/10 dark:to-transparent blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-violet-400/12 to-fuchsia-400/8 dark:from-violet-500/20 dark:to-fuchsia-600/10 blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-fuchsia-400/8 to-orange-400/6 dark:from-fuchsia-600/15 dark:to-orange-500/5 blur-[100px] -z-10 pointer-events-none"></div>
`;

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // 1. Inject blobs if missing
    if (!content.includes('Background Blobs')) {
      content = content.replace(
        /(<div className="flex flex-col min-h-screen[^>]*>)/,
        `$1\n${blobs}`
      );
    }

    // 2. Update `<header className="...">` to add sticky and glass effect classes
    // We look for `<header className="` and if it doesn't have `sticky`, we add it.
    content = content.replace(/<header className="([^"]+)"/g, (match, classes) => {
      if (!classes.includes('sticky')) {
        return `<header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#0c0a1d]/80 border-b border-violet-100/50 dark:border-violet-500/10 transition-all ${classes}"`;
      }
      return match;
    });

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
