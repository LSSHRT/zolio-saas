const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix the + button color
content = content.replace(
  '<Plus size={24} className="text-white" />',
  '<Plus size={24} className="text-blue-600 dark:text-white" />'
);

// 2. Insert the attractive stats banner after the Welcome block
const welcomeEnd = `        </div>

        {/* Action Widgets */}`;

const statsBanner = `        </div>

        {/* Banner Stats Rapides */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 rounded-[1.5rem] p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute right-12 -bottom-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium mb-1">Chiffre d'Affaires Global</p>
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(CA_TTC)}
            </h2>
            
            <div className="flex gap-6 border-t border-white/20 pt-4">
              <div>
                <p className="text-blue-100 text-xs mb-0.5">Devis total</p>
                <p className="font-semibold">{devis.length}</p>
              </div>
              <div>
                <p className="text-blue-100 text-xs mb-0.5">Devis acceptés</p>
                <p className="font-semibold">{devis.filter(d => d.statut === 'Accepté').length}</p>
              </div>
              <div>
                <p className="text-blue-100 text-xs mb-0.5">En attente</p>
                <p className="font-semibold">{devis.filter(d => d.statut === 'En attente' || d.statut === 'En attente (Modifié)').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Widgets */}`;

if (content.includes(welcomeEnd)) {
  content = content.replace(welcomeEnd, statsBanner);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Dashboard patched successfully!");
} else {
  console.log("Could not find the target string to patch.");
}
