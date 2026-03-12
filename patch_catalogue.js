const fs = require('fs');

let content = fs.readFileSync('src/app/catalogue/page.tsx', 'utf8');

// 1. Add Pencil import
content = content.replace('X, Trash2, Copy, Download', 'X, Trash2, Copy, Download, Pencil');

// 2. Add categories if needed
if (!content.includes('"Plomberie"')) {
    content = content.replace('["Préparation", "Peinture", "Sol", "Plafond", "Façade", "Décoration", "Autre"]', '["Préparation", "Peinture", "Sol", "Plafond", "Façade", "Décoration", "Plomberie", "Électricité", "Menuiserie", "Autre"]');
}

// 3. Update SEED_CATALOG
const seedCatalogRegex = /const SEED_CATALOG = \[[\s\S]*?\];/;
const newSeedCatalog = `const SEED_CATALOG = [
  // Préparation
  { categorie: "Préparation", nom: "Lessivage des murs", unite: "m²", prixUnitaireHT: 5, coutMatiere: 0.5 },
  { categorie: "Préparation", nom: "Enduit de lissage complet", unite: "m²", prixUnitaireHT: 15, coutMatiere: 2 },
  { categorie: "Préparation", nom: "Dépose de papier peint", unite: "m²", prixUnitaireHT: 8, coutMatiere: 0 },
  { categorie: "Préparation", nom: "Ponçage mécanique", unite: "m²", prixUnitaireHT: 6, coutMatiere: 0.5 },
  { categorie: "Préparation", nom: "Impression fixante (Sous-couche)", unite: "m²", prixUnitaireHT: 7, coutMatiere: 1.5 },
  // Peinture
  { categorie: "Peinture", nom: "Peinture acrylique mate (2 couches)", unite: "m²", prixUnitaireHT: 12, coutMatiere: 3 },
  { categorie: "Peinture", nom: "Peinture velours (2 couches)", unite: "m²", prixUnitaireHT: 14, coutMatiere: 4 },
  { categorie: "Peinture", nom: "Peinture satinée (2 couches)", unite: "m²", prixUnitaireHT: 15, coutMatiere: 4 },
  { categorie: "Peinture", nom: "Peinture laque (boiseries)", unite: "ml", prixUnitaireHT: 18, coutMatiere: 5 },
  { categorie: "Peinture", nom: "Peinture plafond sans traces", unite: "m²", prixUnitaireHT: 16, coutMatiere: 3.5 },
  // Sol
  { categorie: "Sol", nom: "Pose de parquet flottant", unite: "m²", prixUnitaireHT: 25, coutMatiere: 2 },
  { categorie: "Sol", nom: "Pose de plinthes", unite: "ml", prixUnitaireHT: 8, coutMatiere: 1 },
  { categorie: "Sol", nom: "Ragréage sol", unite: "m²", prixUnitaireHT: 12, coutMatiere: 4 },
  { categorie: "Sol", nom: "Pose de carrelage standard (hors fourniture)", unite: "m²", prixUnitaireHT: 45, coutMatiere: 5 },
  // Plomberie
  { categorie: "Plomberie", nom: "Recherche de fuite", unite: "forfait", prixUnitaireHT: 150, coutMatiere: 0 },
  { categorie: "Plomberie", nom: "Remplacement mitigeur", unite: "unité", prixUnitaireHT: 80, coutMatiere: 0 },
  { categorie: "Plomberie", nom: "Pose de WC suspendu", unite: "unité", prixUnitaireHT: 350, coutMatiere: 20 },
  // Électricité
  { categorie: "Électricité", nom: "Création prise de courant", unite: "unité", prixUnitaireHT: 90, coutMatiere: 15 },
  { categorie: "Électricité", nom: "Remplacement tableau électrique", unite: "forfait", prixUnitaireHT: 800, coutMatiere: 300 },
  // Menuiserie
  { categorie: "Menuiserie", nom: "Pose porte intérieure", unite: "unité", prixUnitaireHT: 150, coutMatiere: 10 },
];`;
content = content.replace(seedCatalogRegex, newSeedCatalog);

// 4. Add editingId state
if (!content.includes('const [editingId, setEditingId] = useState')) {
    content = content.replace('const [saving, setSaving] = useState(false);', 'const [saving, setSaving] = useState(false);\n  const [editingId, setEditingId] = useState<string | null>(null);');
}

// 5. Update handleSubmit to handle PUT
const newHandleSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? \`/api/prestations/\${editingId}\` : "/api/prestations";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, prixUnitaireHT: parseFloat(form.prixUnitaireHT), coutMatiere: parseFloat(form.coutMatiere) || 0 }),
      });
      const data = await res.json();
      if (editingId) {
        setPrestations(prestations.map(p => p.id === editingId ? { ...p, ...data.data, id: editingId } : p));
      } else {
        setPrestations([...prestations, data]);
      }
      setForm({ categorie: "Peinture", nom: "", unite: "m²", prixUnitaireHT: "", coutMatiere: "" });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
    setSaving(false);
  };`;
content = content.replace(/const handleSubmit = async \([\s\S]*?setSaving\(false\);\n  };/, newHandleSubmit);

// 6. Update handleDuplicate
const newHandleDuplicate = `  const handleDuplicate = (p: Prestation) => {
    setForm({
      categorie: p.categorie,
      nom: p.nom + " (Copie)",
      unite: p.unite,
      prixUnitaireHT: p.prixUnitaireHT.toString(),
      coutMatiere: p.coutMatiere ? p.coutMatiere.toString() : "",
    });
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };`;
content = content.replace(/const handleDuplicate = \([\s\S]*?window.scrollTo\(\{ top: 0, behavior: 'smooth' \}\);\n  };/, newHandleDuplicate);

// 7. Add handleEdit
if (!content.includes('const handleEdit')) {
    const handleEdit = `\n  const handleEdit = (p: Prestation) => {
    setForm({
      categorie: p.categorie,
      nom: p.nom,
      unite: p.unite,
      prixUnitaireHT: p.prixUnitaireHT.toString(),
      coutMatiere: p.coutMatiere ? p.coutMatiere.toString() : "",
    });
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };\n`;
    content = content.replace('const handleDuplicate', handleEdit + '\n  const handleDuplicate');
}

// 8. Add Pencil button in the map
const editButton = `
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={16} />
                  </button>`;
if (!content.includes('<Pencil size={16} />')) {
    content = content.replace(/<button\s+onClick=\{\(\) => handleDuplicate\(p\)\}[\s\S]*?<\/button>/, match => editButton + '\n' + match);
}

// 9. Fix header to say "Modifier" or "Nouvelle"
content = content.replace(/{showForm \? <X size=\{20\} \/> : <Plus size=\{20\} \/>}/, `{showForm ? <X size={20} /> : <Plus size={20} />}`);
content = content.replace('onClick={() => setShowForm(!showForm)}', 'onClick={() => { setShowForm(!showForm); if(showForm) setEditingId(null); setForm({ categorie: "Peinture", nom: "", unite: "m²", prixUnitaireHT: "", coutMatiere: "" }); }}');
content = content.replace('<h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Nouvelle Prestation</h2>', '<h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{editingId ? "Modifier la Prestation" : "Nouvelle Prestation"}</h2>');
content = content.replace('{saving ? "Enregistrement..." : "Ajouter au catalogue"}', '{saving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Ajouter au catalogue"}');

fs.writeFileSync('src/app/catalogue/page.tsx', content);
console.log('catalogue patched');
