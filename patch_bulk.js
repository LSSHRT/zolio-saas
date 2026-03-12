const fs = require('fs');

function patchFile(filepath, config) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Add selectedIds state
  if (!content.includes('const [selectedIds, setSelectedIds]')) {
    content = content.replace(
      /const \[search, setSearch\] = useState\(""\);/,
      `const [search, setSearch] = useState("");\n  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());\n  const [isDeletingBulk, setIsDeletingBulk] = useState(false);`
    );
  }

  // Add handleBulkDelete
  if (!content.includes('const handleBulkDelete')) {
    const handleBulkDeleteCode = `
  const handleBulkDelete = async () => {
    if (!confirm(\`Êtes-vous sûr de vouloir supprimer \${selectedIds.size} élément(s) ?\`)) return;
    setIsDeletingBulk(true);
    let successCount = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        const res = await fetch(\`${config.apiEndpoint}/\${id}\`, { method: "DELETE" });
        if (res.ok) successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    if (successCount > 0) {
      mutate(${config.listVar}.filter((item: any) => !selectedIds.has(item.${config.idField})), false);
      setSelectedIds(new Set());
    }
    setIsDeletingBulk(false);
  };
`;
    // Insert after handleDelete
    const deleteRegex = new RegExp(`const handleDelete.*?};`, 's');
    content = content.replace(deleteRegex, (match) => match + '\n' + handleBulkDeleteCode);
  }

  // Add Select All and Floating Bar
  if (!content.includes('Sélectionner tout')) {
    const selectAllCode = `
        {/* Bulk Actions */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(new Set(filtered.map((item: any) => item.${config.idField})));
                } else {
                  setSelectedIds(new Set());
                }
              }}
            />
            Sélectionner tout (\${filtered.length})
          </label>
        </div>
`;
    content = content.replace(
      /(<main[^>]*>[\s\S]*?<div className="relative">[\s\S]*?<\/div>)/,
      `$1\n${selectAllCode}`
    );
  }

  // Inject checkbox in item
  if (!content.includes(`selectedIds.has(`)) {
    const itemMapRegex = new RegExp(`(${config.filteredVar}\\.map\\([^=>]+=>\\s*\\([\\s\\S]*?)(<div[^>]*>)`);
    content = content.replace(itemMapRegex, (match, p1, p2) => {
      return p1 + p2.replace('>', ' onClick={() => {\n' +
        '                      const newSet = new Set(selectedIds);\n' +
        '                      if (newSet.has(' + config.itemVar + '.' + config.idField + ')) newSet.delete(' + config.itemVar + '.' + config.idField + ');\n' +
        '                      else newSet.add(' + config.itemVar + '.' + config.idField + ');\n' +
        '                      setSelectedIds(newSet);\n' +
        '                    }} className="cursor-pointer transition-colors ' + (content.includes('hover:bg-slate-50') ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50') + '">') + `
                  <div className="pr-3" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      checked={selectedIds.has(${config.itemVar}.${config.idField})}
                      onChange={(e) => {
                        const newSet = new Set(selectedIds);
                        if (e.target.checked) newSet.add(${config.itemVar}.${config.idField});
                        else newSet.delete(${config.itemVar}.${config.idField});
                        setSelectedIds(newSet);
                      }}
                    />
                  </div>
`;
    });
  }

  // Floating Bulk Delete Button
  if (!content.includes('isDeletingBulk ?')) {
    const floatingButton = `
      {/* Floating Bulk Delete Action */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 mx-auto max-w-sm px-4 z-50"
          >
            <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between">
              <span className="font-medium">\${selectedIds.size} sélectionné(s)</span>
              <button 
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isDeletingBulk ? <span className="animate-spin text-lg">⏳</span> : <Trash2 size={16} />}
                Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
`;
    content = content.replace(/<\/div>\s*$/, floatingButton);
  }

  // Add AnimatePresence import if missing
  if (!content.includes('AnimatePresence')) {
    content = content.replace(/import \{ motion \}/, 'import { motion, AnimatePresence }');
    if (!content.includes('AnimatePresence')) {
      content = content.replace(/import \{ motion,?[^}]*\} from "framer-motion";/, 'import { motion, AnimatePresence } from "framer-motion";');
    }
  }

  fs.writeFileSync(filepath, content);
  console.log(`Patched ${filepath}`);
}

try {
  patchFile('src/app/clients/page.tsx', { apiEndpoint: '/api/clients', listVar: 'clients', idField: 'id', filteredVar: 'filtered', itemVar: 'client' });
  patchFile('src/app/devis/page.tsx', { apiEndpoint: '/api/devis', listVar: 'devis', idField: 'numero', filteredVar: 'filtered', itemVar: 'd' });
  patchFile('src/app/factures/page.tsx', { apiEndpoint: '/api/factures', listVar: 'factures', idField: 'numero', filteredVar: 'filtered', itemVar: 'f' });
  patchFile('src/app/catalogue/page.tsx', { apiEndpoint: '/api/prestations', listVar: 'prestations', idField: 'id', filteredVar: 'filtered', itemVar: 'item' });
} catch(e) {
  console.error(e);
}
