import { Sparkles, X } from "lucide-react";

type AIAssistantProps = {
  isGenerating: boolean;
  onClose: () => void;
  onGenerate: () => void;
  onPromptChange: (value: string) => void;
  open: boolean;
  prompt: string;
};

const QUICK_PROMPTS = [
  "Rénovation salle de bain avec douche italienne",
  "Rafraîchissement complet d’un T2 avant location",
  "Création d’une cloison BA13 avec isolation",
];

export function AIAssistant({
  isGenerating,
  onClose,
  onGenerate,
  onPromptChange,
  open,
  prompt,
}: AIAssistantProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-[#0d1328] sm:max-h-[80vh] sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
              Assistant IA
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white sm:text-2xl">
              Décrivez le chantier, l’IA prépare les lignes
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Gardez l’IA comme accélérateur secondaire: elle propose un premier jet, vous gardez la main sur chaque ligne.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/8"
            aria-label="Fermer l'assistant IA"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onPromptChange(item)}
                className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:border-violet-400/20 dark:hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="Ex: Refaire une salle de bain de 10m² avec dépose, plomberie, faïence murale, meuble vasque et peinture plafond."
            className="h-40 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base leading-6 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/4 sm:h-44"
          />

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Les lignes générées s’ajoutent à votre devis actuel. Vous pouvez ensuite tout ajuster à la main.
          </p>
        </div>

        <div className="mt-5 border-t border-slate-200/70 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-5 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
          >
            <Sparkles size={16} />
            {isGenerating ? "Génération..." : "Générer les lignes"}
          </button>
        </div>
      </div>
    </div>
  );
}
