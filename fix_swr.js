const fs = require('fs');

function processFile(path) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  
  // If already has SWR, skip
  if (content.includes('import useSWR')) return;

  // 1. Add import
  content = content.replace(
    /import { useState, useEffect } from "react";|import { useState, useEffect, useMemo } from "react";|import { useEffect, useState } from "react";/,
    "import { useState, useEffect, useMemo } from \"react\";\nimport useSWR from \"swr\";"
  );
  if (!content.includes('import useSWR')) {
      content = content.replace('import { useState }', 'import { useState, useEffect }\nimport useSWR from "swr";');
  }

  // Add fetcher if not exists
  if (!content.includes('const fetcher =')) {
      content = content.replace('export default function', 'const fetcher = (url: string) => fetch(url).then((res) => res.json());\n\nexport default function');
  }

  // 2. Replace fetching logic in page.tsx
  if (path.includes('src/app/page.tsx')) {
    content = content.replace(
      /const \[devis, setDevis\] = useState<Devis\[\]>\(\[\]\);\s+const \[loading, setLoading\] = useState\(true\);\s+useEffect\(\(\) => \{\s+fetch\("\/api\/devis"\)\s+\.then\(\(r\) => r\.json\(\)\)\s+\.then\(\(data\) => \{\s+setDevis\(Array\.isArray\(data\) \? data : \[\]\);\s+setLoading\(false\);\s+\}\)\s+\.catch\(\(\) => setLoading\(false\)\);\s+\}, \[\]\);/,
      "const { data, error, isLoading } = useSWR('/api/devis', fetcher, { revalidateOnFocus: true, keepPreviousData: true });\n  const devis = Array.isArray(data) ? data : [];\n  const loading = isLoading && !data;"
    );
  } else if (path.includes('src/app/devis/page.tsx') || path.includes('src/app/factures/page.tsx') || path.includes('src/app/clients/page.tsx')) {
    // Basic replacement for simple devis page
    content = content.replace(
      /const \[devis, setDevis\] = useState<Devis\[\]>\(\[\]\);\s+const \[loading, setLoading\] = useState\(true\);\s+useEffect\(\(\) => \{\s+fetch\("\/api\/devis"\)\s+\.then\(\(r\) => r\.json\(\)\)\s+\.then\(\(data\) => \{\s+setDevis\(Array\.isArray\(data\) \? data : \[\]\);\s+setLoading\(false\);\s+\}\)\s+\.catch\(\(\) => setLoading\(false\)\);\s+\}, \[\]\);/,
      "const { data, error, isLoading } = useSWR('/api/devis', fetcher, { revalidateOnFocus: true, keepPreviousData: true });\n  const devis = Array.isArray(data) ? data : [];\n  const loading = isLoading && !data;"
    );
    // For factures
    content = content.replace(
      /const \[factures, setFactures\] = useState<Facture\[\]>\(\[\]\);\s+const \[loading, setLoading\] = useState\(true\);\s+useEffect\(\(\) => \{\s+fetch\("\/api\/factures"\)\s+\.then\(\(r\) => r\.json\(\)\)\s+\.then\(\(data\) => \{\s+setFactures\(Array\.isArray\(data\) \? data : \[\]\);\s+setLoading\(false\);\s+\}\)\s+\.catch\(\(\) => setLoading\(false\)\);\s+\}, \[\]\);/,
      "const { data, error, isLoading } = useSWR('/api/factures', fetcher, { revalidateOnFocus: true, keepPreviousData: true });\n  const factures = Array.isArray(data) ? data : [];\n  const loading = isLoading && !data;"
    );
  }

  fs.writeFileSync(path, content, 'utf8');
}

['src/app/page.tsx', 'src/app/devis/page.tsx', 'src/app/factures/page.tsx', 'src/app/clients/page.tsx'].forEach(processFile);
