const fs = require('fs');

const filePath = 'src/components/LandingPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const componentsToAdd = `
// Testimonial Card Component
const TestimonialCard = ({ name, role, quote, stars = 5 }: any) => (
  <SpotlightCard className="p-8">
    <div className="flex gap-1 mb-4">
      {[...Array(stars)].map((_, i) => (
        <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
      ))}
    </div>
    <p className="text-neutral-300 mb-6 italic">"{quote}"</p>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center font-bold text-white">
        {name.charAt(0)}
      </div>
      <div>
        <h4 className="font-bold text-white">{name}</h4>
        <p className="text-sm text-neutral-400">{role}</p>
      </div>
    </div>
  </SpotlightCard>
);

// FAQ Item Component
const FAQItem = ({ question, answer }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-neutral-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left focus:outline-none"
      >
        <span className="text-lg font-medium text-white">{question}</span>
        <ChevronDown className={\`w-5 h-5 text-neutral-400 transition-transform duration-300 \${isOpen ? "rotate-180" : ""}\`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-neutral-400">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
`;

const sectionsToAdd = `
        {/* Testimonials Section */}
        <section className="py-32 bg-black relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ils nous font confiance</h2>
              <p className="text-xl text-neutral-400">Rejoignez les artisans qui ont transformé leur quotidien.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TestimonialCard 
                name="Jean Dupont" 
                role="Électricien" 
                quote="Avant Zolio, je passais mes soirées sur mes devis. Aujourd'hui tout est fait sur le chantier. Un vrai gain de temps !" 
              />
              <TestimonialCard 
                name="Marc Leroy" 
                role="Plombier" 
                quote="Le design est incroyable, mes clients sont impressionnés quand je leur fais signer le devis sur ma tablette." 
              />
              <TestimonialCard 
                name="Sophie Martin" 
                role="Peintre" 
                quote="La facturation en 1 clic a changé ma vie. Je suis payée beaucoup plus rapidement et je n'oublie plus aucune facture." 
              />
            </div>
          </div>
        </section>

        {/* Avant/Après Section */}
        <section className="py-32 bg-neutral-950 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Transformez votre manière de travailler</h2>
              <p className="text-xl text-neutral-400">Passez à la vitesse supérieure avec Zolio.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
              <SpotlightCard className="border-red-900/30 bg-red-950/10">
                <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
                  <X className="mr-3" /> Avant Zolio
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start text-neutral-400"><X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" /> Soirées passées à rédiger des devis</li>
                  <li className="flex items-start text-neutral-400"><X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" /> Papiers perdus et relances oubliées</li>
                  <li className="flex items-start text-neutral-400"><X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" /> Calcul de marge approximatif</li>
                  <li className="flex items-start text-neutral-400"><X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" /> Logiciels compliqués des années 2000</li>
                </ul>
              </SpotlightCard>
              <SpotlightCard className="border-violet-500/30 bg-violet-900/10">
                <h3 className="text-2xl font-bold text-violet-400 mb-6 flex items-center">
                  <CheckCircle className="mr-3" /> Avec Zolio
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start text-neutral-300"><CheckCircle className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0 mt-0.5" /> Devis réalisés sur le chantier en 3 min</li>
                  <li className="flex items-start text-neutral-300"><CheckCircle className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0 mt-0.5" /> Signature immédiate sur le smartphone</li>
                  <li className="flex items-start text-neutral-300"><CheckCircle className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0 mt-0.5" /> Rentabilité connue en temps réel</li>
                  <li className="flex items-start text-neutral-300"><CheckCircle className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0 mt-0.5" /> Interface ultra-rapide et intuitive</li>
                </ul>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 bg-black relative">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Questions fréquentes</h2>
              <p className="text-xl text-neutral-400">Tout ce que vous devez savoir avant de vous lancer.</p>
            </div>
            <div className="space-y-2">
              <FAQItem 
                question="L'application fonctionne-t-elle sur téléphone sans internet ?" 
                answer="Zolio est optimisé pour les mobiles. Si vous perdez la connexion sur un chantier, vous pouvez continuer à préparer votre devis, il se synchronisera automatiquement dès que vous retrouverez du réseau." 
              />
              <FAQItem 
                question="Puis-je importer ma liste de clients existante ?" 
                answer="Oui ! Vous pouvez très prochainement importer vos clients et votre catalogue de prix au format Excel/CSV en quelques clics." 
              />
              <FAQItem 
                question="Que se passe-t-il après mon devis d'essai ?" 
                answer="Une fois votre devis d'essai utilisé, vous pourrez passer à la version Pro pour débloquer les devis et factures illimités, sans aucun engagement de durée." 
              />
              <FAQItem 
                question="Mes données sont-elles sécurisées ?" 
                answer="Absolument. Vos données sont hébergées sur des serveurs sécurisés en Europe et sauvegardées quotidiennement. Vous êtes le seul propriétaire de vos informations." 
              />
            </div>
          </div>
        </section>
`;

if (!content.includes('TestimonialCard')) {
  content = content.replace('export default function LandingPage() {', componentsToAdd + '\nexport default function LandingPage() {');
}

if (!content.includes('Questions fréquentes')) {
  content = content.replace('{/* Pricing Section */}', sectionsToAdd + '\n        {/* Pricing Section */}');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Sections added successfully');
