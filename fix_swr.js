const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Remplacer useSWR('/api/xxx', fetcher) par useSWR('/api/xxx', fetcher, { revalidateOnFocus: false, keepPreviousData: true })
  // Mais seulement si ça ne contient pas déjà des options.
  const regex = /useSWR(<[^>]+>)?\((['"`]\/api\/[^'"`]+['"`]), fetcher\)/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, "useSWR$1($2, fetcher, { revalidateOnFocus: false, keepPreviousData: true })");
    changed = true;
  }
  
  // Dans clients, on peut aussi wrap `filtered` en useMemo
  if (file.includes('clients/page.tsx') && content.includes('const filtered = clients.filter')) {
    content = content.replace(
      /const filtered = clients\.filter\(\s*\([^)]*\)\s*=>\s*[^)]*\)\s*\.includes\([^)]*\)\s*\);\s*/,
      `const filtered = useMemo(() => clients.filter(
    (c) => (c.nom || '').toLowerCase().includes((search || '').toLowerCase()) || (c.email || '').toLowerCase().includes((search || '').toLowerCase())
  ), [clients, search]);\n`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
