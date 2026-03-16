const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// 1. Add Image import if not exists
if (!content.includes('import Image from "next/image"')) {
  content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport Image from "next/image";');
}

// 2. Remove CustomCursor hook and component
content = content.replace(/\/\/ --- CUSTOM HOOKS & UTILS ---[\s\S]*?\/\/ 2\. Spotlight Card/m, '// --- COMPONENTS ---\n\n// 2. Spotlight Card');

// 3. Remove <CustomCursor />
content = content.replace(/<CustomCursor \/>\n?\s*/g, '');

// 4. Replace Header logo
content = content.replace(
  /<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-\[0_0_20px_rgba\(139,92,246,0\.5\)\]">\s*<span className="text-white font-bold text-xl leading-none">Z<\/span>\s*<\/div>/,
  '<div className="w-8 h-8 relative rounded-lg overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.5)]">\n              <Image src="/logo.png" alt="Zolio Logo" fill className="object-cover" />\n            </div>'
);

// 5. Replace Footer logo
content = content.replace(
  /<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">\s*<span className="text-white font-bold text-xl leading-none">Z<\/span>\s*<\/div>/,
  '<div className="w-8 h-8 relative rounded-lg overflow-hidden">\n                  <Image src="/logo.png" alt="Zolio Logo" fill className="object-cover" />\n                </div>'
);

fs.writeFileSync('src/components/LandingPage.tsx', content);
console.log('LandingPage updated successfully.');
