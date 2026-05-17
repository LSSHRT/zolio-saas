"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ClientSectionCard,
  ClientSubpageShell,
  type ClientMetaPill,
  type ClientMobileAction,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";

interface LigneEditable {
  id: string;
  nomPrestation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  totalLigne: number;
  tva: string;
}

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

interface Prestation {
  id: string;
  categorie: string;
  nom: string;
  unite: string;
  prix: number;
}

const STORAGE_KEY = "zolio:nouvelle-facture:draft";

function loadDraft(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(data: Record<string, unknown>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export default function NouvelleFacturePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [lignes, setLignes] = useState<LigneEditable[]>([]);
  const [tva, setTva] = useState("20");
  const [acompte, setAcompte] = useState("");
  const [remise, setRemise] = useState("");
  const [sending, setSending] = useState(false);
  const [searchClient, setSearchClient] = useState("");
  const [searchPrestation, setSearchPrestation] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ nom: "", email: "", telephone: "", adresse: "" });
  const [showShowAI, setShowShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const initRef = useRef(false);
  const draftLoadedRef = useRef(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Init
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const draft = loadDraft();
    if (draft) {
      if (Array.isArray(draft.lignes)) setLignes(draft.lignes as LigneEditable[]);
      if (draft.selectedClientId) setSelectedClientId(draft.selectedClientId as string);
      if (draft.tva) setTva(draft.tva as string);
      if (draft.acompte) setAcompte(draft.acompte as string);
      if (draft.remise) setRemise(draft.remise as string);
      if (draft.step) setStep(draft.step as number);
      setDraftSavedAt(new Date());
      setDraftStatus("saved");
    }
    draftLoadedRef.current = true;

    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/prestations").then((r) => r.json()),
    ])
      .then(([cData, pData]) => {
        setClients(Array.isArray(cData) ? cData : []);
        setPrestations(Array.isArray(pData) ? pData : []);
      })
      .catch(() => {});
  }, []);

  // Auto-save (debounced + skip first effect tick to avoid wiping on mount)
  useEffect(() => {
    if (!draftLoadedRef.current) return;
    setDraftStatus("saving");
    const handle = window.setTimeout(() => {
      saveDraft({ lignes, selectedClientId, tva, acompte, remise, step });
      setDraftSavedAt(new Date());
      setDraftStatus("saved");
    }, 400);
    return () => window.clearTimeout(handle);
  }, [lignes, selectedClientId, tva, acompte, remise, step]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const filteredClients = useMemo(() =>
    clients.filter((c) =>
      c.nom.toLowerCase().includes(searchClient.toLowerCase()) ||
      c.email.toLowerCase().includes(searchClient.toLowerCase()),
    ), [clients, searchClient]);

  const filteredPrestations = useMemo(() =>
    prestations.filter((p) =>
      p.nom.toLowerCase().includes(searchPrestation.toLowerCase()) ||
      p.categorie.toLowerCase().includes(searchPrestation.toLowerCase()),
    ), [prestations, searchPrestation]);

  const totalHT = useMemo(() =>
    lignes.reduce((sum, l) => sum + l.totalLigne, 0) * (1 - (parseFloat(remise) || 0) / 100),
    [lignes, remise]);

  const totalTTC = useMemo(() => {
    return lignes.reduce((sum, l) => {
      const tvaRate = parseFloat(l.tva) || parseFloat(tva);
      return sum + l.totalLigne * (1 + tvaRate / 100);
    }, 0) * (1 - (parseFloat(remise) || 0) / 100);
  }, [lignes, tva, remise]);

  const handleSubmit = async (email: boolean) => {
    const client = selectedClient || newClient;
    if (!client.nom) return toast.error("Choisissez ou créez un client.");
    if (lignes.length === 0) return toast.error("Au moins une ligne.");

    setSending(true);
    try {
      const res = await fetch("/api/factures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client,
          lignes,
          tva: parseFloat(tva) || 20,
          totalHT,
          totalTTC,
          email,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erreur");
      }
      clearDraft();
      const data = await res.json();
      toast.success(data.emailSent
        ? `Facture ${data.numeroFacture} envoyée à ${client.nom}.`
        : `Facture ${data.numeroFacture} créée.`);
      setTimeout(() => router.push("/factures"), 500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setSending(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.nom.trim()) return toast.error("Nom obligatoire");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      if (!res.ok) throw new Error(res.statusText);
      const created = await res.json();
      setClients((prev) => [...prev, created]);
      setSelectedClientId(created.id);
      setShowNewClient(false);
      toast.success("Client créé.");
    } catch { toast.error("Erreur création client"); }
  };

  const addPrestation = (p: Prestation) => {
    setLignes([...lignes, {
      id: `p-${Date.now()}-${Math.random()}`,
      nomPrestation: p.nom, quantite: 1, unite: p.unite,
      prixUnitaire: p.prix, totalLigne: p.prix, tva,
    }]);
  };

  const addEmptyLine = () => {
    setLignes([...lignes, {
      id: `e-${Date.now()}-${Math.random()}`,
      nomPrestation: "", quantite: 1, unite: "U",
      prixUnitaire: 0, totalLigne: 0, tva,
    }]);
  };

  const updateLine = (id: string, patch: Partial<LigneEditable>) => {
    setLignes(lignes.map((l) => {
      if (l.id !== id) return l;
      const u = { ...l, ...patch };
      u.totalLigne = (u.quantite ?? 0) * (u.prixUnitaire ?? 0);
      return u;
    }));
  };

  const removeLine = (id: string) => setLignes(lignes.filter((l) => l.id !== id));

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur IA");
      if (!Array.isArray(data.lignes)) throw new Error("Aucune ligne");
      const newL = data.lignes.map((line: { designation: string; quantite: number; unite: string; prixUnitaire: number }, i: number) => ({
        id: `ai-${Date.now()}-${i}`,
        nomPrestation: line.designation, quantite: line.quantite,
        unite: line.unite, prixUnitaire: line.prixUnitaire,
        totalLigne: line.quantite * line.prixUnitaire, tva,
      }));
      setLignes([...lignes, ...newL]);
      setShowShowAI(false);
      toast.success(`${newL.length} ligne(s) ajoutée(s)`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setAiGenerating(false); }
  };

  const mobileActions: ClientMobileAction[] = [
    { label: "Annuler", onClick: () => router.push("/factures"), icon: ArrowLeft },
  ];

  const steps = [
    { num: 1, title: "Client" },
    { num: 2, title: "Prestations" },
    { num: 3, title: "Options" },
    { num: 4, title: "Confirmation" },
  ];

  const canNext = step === 1 ? (selectedClientId || newClient.nom.trim()) : step === 2 ? lignes.length > 0 : true;
  const clientName = selectedClient?.nom || newClient.nom.trim();
  const hasClient = Boolean(clientName);
  const canSubmit = hasClient && lignes.length > 0;
  const totalHTBrut = useMemo(
    () => lignes.reduce((sum, l) => sum + l.totalLigne, 0),
    [lignes],
  );
  const remisePct = parseFloat(remise) || 0;
  const acompteEur = parseFloat(acompte) || 0;
  const remiseEur = totalHTBrut * (remisePct / 100);
  const tvaTotalEur = totalTTC - totalHT;
  const aReglerEur = Math.max(0, totalTTC - acompteEur);

  const draftLabel = (() => {
    if (draftStatus === "saving") return "Enregistrement…";
    if (draftStatus === "saved" && draftSavedAt) {
      return `Brouillon · ${draftSavedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return null;
  })();

  const metaPills: ClientMetaPill[] = [
    { icon: FileText, label: `Étape ${step}/${steps.length} · ${steps[step - 1]?.title}`, tone: "violet" },
    ...(clientName
      ? [{ icon: Users, label: clientName, tone: "emerald" as const }]
      : []),
    ...(lignes.length > 0
      ? [{ icon: FileText, label: `${lignes.length} ligne${lignes.length > 1 ? "s" : ""}`, tone: "slate" as const }]
      : []),
    ...(totalTTC > 0
      ? [{ label: `${totalTTC.toFixed(2)}€ TTC`, tone: "violet" as const }]
      : []),
    ...(draftLabel
      ? [{
          icon: draftStatus === "saving" ? Loader2 : Save,
          label: draftLabel,
          tone: "slate" as const,
        }]
      : []),
  ];

  const focusLine = step === 1
    ? <>Choisissez un client existant ou créez-en un nouveau pour démarrer.</>
    : step === 2
      ? <>Ajoutez vos prestations depuis le catalogue ou laissez l&apos;IA générer un brouillon.</>
      : step === 3
        ? <>Affinez TVA, remise et acompte avant de générer la facture.</>
        : <>Vérifiez les informations puis créez la facture (avec ou sans envoi email).</>;

  return (
    <ClientSubpageShell
      title="Nouvelle facture"
      description="Créez une facture directement — sans passer par un devis."
      eyebrow="Création rapide"
      activeNav="factures"
      backHref="/factures"
      breadcrumbs={[
        { label: "Factures", href: "/factures" },
        { label: "Nouvelle facture" },
      ]}
      metaPills={metaPills}
      focusLine={focusLine}
      mobileSecondaryActions={mobileActions}
      mobilePrimaryAction={
        <Link
          href="/factures"
          aria-label="Retour aux factures"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <ArrowLeft size={16} /> Retour
        </Link>
      }
    >
      {/* ─── Mobile / tablet wizard (lg:hidden) — preserved 4-step flow ─── */}
      <div className="space-y-4 lg:hidden">
      {/* Steps */}
      <ClientSectionCard className="!p-3">
        <ol
          aria-label="Étapes de création"
          className="flex items-center gap-1.5"
        >
          {steps.map((s) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            const canJumpBack = isDone;
            const baseClass =
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-center text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40";
            const stateClass = isActive
              ? "bg-gradient-zolio text-white shadow-brand"
              : isDone
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500";
            return (
              <li key={s.num} className="flex flex-1">
                {canJumpBack ? (
                  <button
                    type="button"
                    onClick={() => setStep(s.num)}
                    aria-label={`Revenir à l'étape ${s.num} (${s.title})`}
                    className={`${baseClass} ${stateClass}`}
                  >
                    <Check size={12} aria-hidden /> {s.title}
                  </button>
                ) : (
                  <span
                    aria-current={isActive ? "step" : undefined}
                    className={`${baseClass} ${stateClass}`}
                  >
                    <span aria-hidden>{s.num}</span> {s.title}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </ClientSectionCard>

      {/* STEP 1: Client */}
      {step === 1 && (
        <ClientSectionCard>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200 mb-4">
            Choisissez le client
          </p>

          {selectedClient ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                {selectedClient.nom.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{selectedClient.nom}</p>
                <p className="text-xs text-slate-500 truncate">{selectedClient.email || selectedClient.telephone}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClientId("")}
                aria-label="Retirer le client sélectionné"
                className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-900/5 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:hover:bg-white/8"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={searchClient} onChange={(e) => setSearchClient(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pl-9 text-base focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-slate-700 dark:bg-slate-900" />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
                {filteredClients.slice(0, 6).map((c) => (
                  <button key={c.id} onClick={() => setSelectedClientId(c.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:bg-violet-50 transition text-left dark:border-slate-800 dark:bg-slate-900">
                    <div className="h-8 w-8 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{c.nom.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{c.nom}</p>
                      <p className="text-xs text-slate-400 truncate">{c.email || c.telephone}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowNewClient(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
                <Plus size={16} /> Nouveau client
              </button>
            </>
          )}
        </ClientSectionCard>
      )}

      {/* STEP 2: Lignes */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <ClientSectionCard>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Lignes ({lignes.length})</p>
              <div className="flex gap-2">
                <button onClick={() => setShowShowAI(true)} className="text-xs text-violet-600 font-semibold flex items-center gap-1 dark:text-violet-400">
                  <Sparkles size={14} /> IA
                </button>
              </div>
            </div>

            <div className="relative mb-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchPrestation} onChange={(e) => setSearchPrestation(e.target.value)}
                placeholder="Rechercher dans le catalogue..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pl-9 text-base focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-slate-700 dark:bg-slate-900" />
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 mb-3">
              {filteredPrestations.slice(0, 6).map((p) => (
                <button key={p.id} onClick={() => addPrestation(p)}
                  className="w-full flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-left hover:bg-violet-50 transition text-sm">
                  <Plus size={14} className="text-violet-500 shrink-0" />
                  <span className="flex-1 truncate">{p.nom}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Tag size={11} />{p.categorie}</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{p.prix}€/{p.unite}</span>
                </button>
              ))}
            </div>

            <button onClick={addEmptyLine}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/4">
              <Plus size={16} /> Ligne libre
            </button>
          </ClientSectionCard>

          {/* Lignes */}
          {lignes.map((l) => (
            <ClientSectionCard key={l.id} className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <input
                  value={l.nomPrestation}
                  onChange={(e) => updateLine(l.id, { nomPrestation: e.target.value })}
                  placeholder="Nom de la prestation..."
                  className="flex-1 mr-2 bg-transparent border-b border-slate-200 dark:border-slate-700 py-1 text-sm font-medium focus:outline-none focus:border-violet-500 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeLine(l.id)}
                  aria-label={`Supprimer la ligne ${l.nomPrestation || "sans nom"}`}
                  className="shrink-0 rounded-full p-2 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400">Qté</label>
                  <input type="number" value={l.quantite} min="0.1" step="any"
                    onChange={(e) => updateLine(l.id, { quantite: parseFloat(e.target.value) || 1 })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Prix</label>
                  <input type="number" value={l.prixUnitaire} min="0" step="any"
                    onChange={(e) => updateLine(l.id, { prixUnitaire: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2 dark:bg-violet-500/10">
                <span className="text-[11px] text-violet-400">Total ligne</span>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{l.totalLigne.toFixed(2)}€</p>
              </div>
            </ClientSectionCard>
          ))}

          {/* Mini total */}
          <div className="bg-gradient-zolio rounded-2xl p-4 text-white">
            <p className="text-white/70 text-sm">Total TTC</p>
            <p className="text-2xl font-bold">{totalTTC.toFixed(2)}€</p>
          </div>
        </div>
      )}

      {/* STEP 3: Options */}
      {step === 3 && (
        <ClientSectionCard>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">TVA (%)</span>
                <select value={tva} onChange={(e) => setTva(e.target.value)}
                  className="mt-1 w-full bg-transparent text-lg font-bold focus:outline-none dark:text-white">
                  <option value="0">0%</option>
                  <option value="5.5">5.5%</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                </select>
              </label>
              <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Remise (%)</span>
                <input type="number" value={remise} onChange={(e) => setRemise(e.target.value)} placeholder="0" min="0" max="100" step="any"
                  className="mt-1 w-full bg-transparent text-lg font-bold focus:outline-none dark:text-white" />
              </label>
              <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Acompte (€)</span>
                <input type="number" value={acompte} onChange={(e) => setAcompte(e.target.value)} placeholder="0" min="0" step="0.01"
                  className="mt-1 w-full bg-transparent text-lg font-bold focus:outline-none dark:text-white" />
              </label>
            </div>
          </div>
        </ClientSectionCard>
      )}

      {/* STEP 4: Confirm */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <ClientSectionCard>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-300 mb-2">Client</p>
            <p className="text-base font-semibold text-slate-800 dark:text-white">{selectedClient?.nom || newClient.nom}</p>
            {(selectedClient?.email || newClient.email) && <p className="text-sm text-slate-500">{selectedClient?.email || newClient.email}</p>}
          </ClientSectionCard>

          <ClientSectionCard>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Lignes ({lignes.length})</p>
            <div className="space-y-2">
              {lignes.map((l) => (
                <div key={l.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{l.nomPrestation || "—"}</p>
                    <p className="text-xs text-slate-500">{l.quantite} × {l.prixUnitaire}€</p>
                  </div>
                  <p className="text-sm font-semibold dark:text-white">{l.totalLigne.toFixed(2)}€</p>
                </div>
              ))}
            </div>
          </ClientSectionCard>

          {remise && parseFloat(remise) > 0 && (
            <div className="flex justify-between rounded-xl bg-amber-50 px-4 py-2 dark:bg-amber-500/10">
              <span className="text-sm text-amber-700 dark:text-amber-300">Remise ({remise}%)</span>
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">−{(totalHT * (parseFloat(remise) / 100)).toFixed(2)}€</span>
            </div>
          )}

          {acompte && parseFloat(acompte) > 0 && (
            <div className="flex justify-between rounded-xl bg-emerald-50 px-4 py-2 dark:bg-emerald-500/10">
              <span className="text-sm text-emerald-700 dark:text-emerald-300">Acompte</span>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">−{parseFloat(acompte).toFixed(2)}€</span>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-gradient-zolio px-5 py-4 text-white">
            <span className="text-sm font-medium text-white/80">Total TTC</span>
            <span className="text-xl font-bold">{totalTTC.toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 sm:sticky sm:bottom-4 sm:inset-x-auto">
        <div className="client-panel rounded-2xl px-4 py-4 shadow-[0_32px_90px_-52px_rgba(15,23,42,0.42)] sm:rounded-2xl">
          <div className="flex items-center gap-3">
            {step > 1 && step < 4 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                aria-label={`Étape précédente : ${steps[step - 2]?.title}`}
                className="flex items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ArrowLeft size={16} aria-hidden />
              </button>
            )}

            {step < 4 && canNext && (
              <button onClick={() => setStep(step + 1)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio py-3 text-sm font-semibold text-white shadow-lg">
                Suivant <Check size={16} />
              </button>
            )}

            {step === 4 && (
              <div className="flex-1 grid grid-cols-2 gap-2">
                <button onClick={() => handleSubmit(false)} disabled={sending}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio py-3 text-sm font-semibold text-white disabled:opacity-50">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Créer
                </button>
                <button onClick={() => handleSubmit(true)} disabled={sending}
                  className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white py-3 text-sm font-semibold text-violet-700 disabled:opacity-50 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Créer + Envoyer
                </button>
              </div>
            )}

            {step < 4 && !canNext && (
              <div className="flex-1 text-center text-xs text-slate-400">
                {!selectedClientId && !newClient.nom ? "Sélectionnez un client" : "Ajoutez des lignes"}
              </div>
            )}
          </div>
        </div>
      </div>

      </div>

      {/* ─── Desktop dense single-page form (hidden lg:block) ─── */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
        {/* LEFT : Client + Lignes + Options */}
        <div className="lg:col-span-8 space-y-6">
          {/* Client */}
          <section className="lg-v2-panel p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="lg-v2-eyebrow">Client</p>
                <h2 className="mt-1 text-base font-semibold lg-v2-text-strong">
                  {selectedClient ? "Client sélectionné" : "Choisir un client"}
                </h2>
                <p className="mt-1 text-xs lg-v2-text-subtle">
                  Sélectionnez un client existant ou créez-en un nouveau.
                </p>
              </div>
              {!selectedClient ? (
                <button
                  type="button"
                  onClick={() => setShowNewClient(true)}
                  className="lg-v2-btn lg-v2-btn-secondary"
                >
                  <UserPlus size={14} aria-hidden /> Nouveau client
                </button>
              ) : null}
            </div>

            {selectedClient ? (
              <div className="mt-4 flex items-center gap-3 rounded-lg border lg-v2-divider lg-v2-panel-muted px-4 py-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: "var(--v2-primary)" }}
                  aria-hidden
                >
                  {selectedClient.nom.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold lg-v2-text-strong">{selectedClient.nom}</p>
                  <p className="truncate text-xs lg-v2-text-muted">
                    {selectedClient.email || selectedClient.telephone || selectedClient.adresse || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClientId("")}
                  className="lg-v2-btn lg-v2-btn-ghost !px-2"
                  aria-label="Retirer le client sélectionné"
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            ) : (
              <>
                <div className="relative mt-4">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 lg-v2-text-subtle"
                    aria-hidden
                  />
                  <input
                    type="text"
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    placeholder="Rechercher un client par nom ou email…"
                    className="lg-v2-input pl-9"
                    aria-label="Rechercher un client"
                  />
                </div>
                <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border lg-v2-divider">
                  {filteredClients.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm lg-v2-text-subtle">
                      {clients.length === 0
                        ? "Vous n'avez pas encore de clients. Créez-en un pour démarrer."
                        : "Aucun client ne correspond à cette recherche."}
                    </p>
                  ) : (
                    <ul className="divide-y lg-v2-divider">
                      {filteredClients.slice(0, 8).map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedClientId(c.id)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[var(--v2-panel-muted)]"
                          >
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: "var(--v2-primary-soft-strong)",
                                color: "var(--v2-primary)",
                              }}
                              aria-hidden
                            >
                              {c.nom.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium lg-v2-text-strong">{c.nom}</p>
                              <p className="truncate text-xs lg-v2-text-subtle">
                                {c.email || c.telephone || "—"}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>

          {/* Lignes */}
          <section className="lg-v2-panel p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="lg-v2-eyebrow">Prestations</p>
                <h2 className="mt-1 text-base font-semibold lg-v2-text-strong">
                  Lignes <span className="lg-v2-text-subtle font-normal">({lignes.length})</span>
                </h2>
                <p className="mt-1 text-xs lg-v2-text-subtle">
                  Ajoutez des prestations depuis le catalogue ou créez des lignes libres.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowShowAI(true)}
                  className="lg-v2-btn lg-v2-btn-secondary"
                >
                  <Sparkles size={14} aria-hidden /> Générer avec l&apos;IA
                </button>
                <button
                  type="button"
                  onClick={addEmptyLine}
                  className="lg-v2-btn lg-v2-btn-primary"
                >
                  <Plus size={14} aria-hidden /> Ligne libre
                </button>
              </div>
            </div>

            <div className="relative mt-4">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 lg-v2-text-subtle"
                aria-hidden
              />
              <input
                type="text"
                value={searchPrestation}
                onChange={(e) => setSearchPrestation(e.target.value)}
                placeholder="Ajouter depuis le catalogue (rechercher par nom ou catégorie)…"
                className="lg-v2-input pl-9"
                aria-label="Rechercher une prestation"
              />
              {searchPrestation.trim() && filteredPrestations.length > 0 ? (
                <div
                  className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border lg-v2-divider shadow-md"
                  style={{ backgroundColor: "var(--v2-panel)" }}
                  role="listbox"
                >
                  {filteredPrestations.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        addPrestation(p);
                        setSearchPrestation("");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-[var(--v2-panel-muted)]"
                      role="option"
                      aria-selected="false"
                    >
                      <Plus size={12} className="shrink-0 text-[var(--v2-primary)]" aria-hidden />
                      <span className="flex-1 truncate lg-v2-text">{p.nom}</span>
                      <span className="inline-flex items-center gap-1 text-xs lg-v2-text-subtle">
                        <Tag size={10} aria-hidden />
                        {p.categorie}
                      </span>
                      <span className="whitespace-nowrap text-xs font-semibold lg-v2-text-muted">
                        {p.prix}€ / {p.unite}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {lignes.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed lg-v2-divider px-6 py-10 text-center">
                <p className="text-sm font-medium lg-v2-text-muted">Aucune ligne pour le moment.</p>
                <p className="mt-1 text-xs lg-v2-text-subtle">
                  Ajoutez une ligne libre, choisissez depuis le catalogue ou générez avec l&apos;IA.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-lg border lg-v2-divider">
                <table className="w-full border-collapse text-left" aria-label="Lignes de la facture">
                  <thead>
                    <tr>
                      <th className="lg-v2-table-header">Désignation</th>
                      <th className="lg-v2-table-header w-20 !text-right">Qté</th>
                      <th className="lg-v2-table-header w-20">Unité</th>
                      <th className="lg-v2-table-header w-28 !text-right">P.U. €</th>
                      <th className="lg-v2-table-header w-20">TVA</th>
                      <th className="lg-v2-table-header w-28 !text-right">Total €</th>
                      <th className="lg-v2-table-header w-10" aria-label="Actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l) => (
                      <tr key={l.id} className="lg-v2-table-row">
                        <td className="lg-v2-table-cell">
                          <input
                            type="text"
                            value={l.nomPrestation}
                            onChange={(e) => updateLine(l.id, { nomPrestation: e.target.value })}
                            placeholder="Nom de la prestation"
                            className="w-full bg-transparent text-sm lg-v2-text-strong placeholder:lg-v2-text-subtle focus:outline-none"
                            aria-label="Désignation"
                          />
                        </td>
                        <td className="lg-v2-table-cell text-right">
                          <input
                            type="number"
                            value={l.quantite}
                            min="0"
                            step="any"
                            onChange={(e) => updateLine(l.id, { quantite: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-transparent text-right text-sm tabular-nums lg-v2-text focus:outline-none"
                            aria-label="Quantité"
                          />
                        </td>
                        <td className="lg-v2-table-cell">
                          <input
                            type="text"
                            value={l.unite}
                            onChange={(e) => updateLine(l.id, { unite: e.target.value })}
                            className="w-full bg-transparent text-sm lg-v2-text-muted focus:outline-none"
                            aria-label="Unité"
                          />
                        </td>
                        <td className="lg-v2-table-cell text-right">
                          <input
                            type="number"
                            value={l.prixUnitaire}
                            min="0"
                            step="any"
                            onChange={(e) => updateLine(l.id, { prixUnitaire: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-transparent text-right text-sm tabular-nums lg-v2-text focus:outline-none"
                            aria-label="Prix unitaire"
                          />
                        </td>
                        <td className="lg-v2-table-cell">
                          <select
                            value={l.tva}
                            onChange={(e) => updateLine(l.id, { tva: e.target.value })}
                            className="w-full bg-transparent text-sm lg-v2-text-muted focus:outline-none"
                            aria-label="TVA"
                          >
                            <option value="0">0%</option>
                            <option value="5.5">5.5%</option>
                            <option value="10">10%</option>
                            <option value="20">20%</option>
                          </select>
                        </td>
                        <td className="lg-v2-table-cell text-right text-sm font-semibold tabular-nums lg-v2-text-strong">
                          {l.totalLigne.toFixed(2)}
                        </td>
                        <td className="lg-v2-table-cell !p-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(l.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-[var(--v2-danger-soft)]"
                            aria-label={`Supprimer la ligne ${l.nomPrestation || "sans nom"}`}
                          >
                            <Trash2 size={14} className="text-[var(--v2-danger)]" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Options */}
          <section className="lg-v2-panel p-6">
            <p className="lg-v2-eyebrow">Options</p>
            <h2 className="mt-1 text-base font-semibold lg-v2-text-strong">Réglages globaux</h2>
            <p className="mt-1 text-xs lg-v2-text-subtle">
              TVA par défaut appliquée aux nouvelles lignes, remise globale et acompte versé.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <label className="block">
                <span className="text-xs font-medium lg-v2-text-muted">TVA par défaut</span>
                <select
                  value={tva}
                  onChange={(e) => setTva(e.target.value)}
                  className="lg-v2-input mt-1.5"
                >
                  <option value="0">0%</option>
                  <option value="5.5">5.5%</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium lg-v2-text-muted">Remise globale (%)</span>
                <input
                  type="number"
                  value={remise}
                  onChange={(e) => setRemise(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="any"
                  className="lg-v2-input mt-1.5 tabular-nums"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium lg-v2-text-muted">Acompte versé (€)</span>
                <input
                  type="number"
                  value={acompte}
                  onChange={(e) => setAcompte(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="lg-v2-input mt-1.5 tabular-nums"
                />
              </label>
            </div>
          </section>
        </div>

        {/* RIGHT : Summary + Actions (sticky) */}
        <aside className="self-start lg:col-span-4 lg:sticky lg:top-6">
          <div className="space-y-4">
            {/* Summary */}
            <div className="lg-v2-panel p-6">
              <p className="lg-v2-eyebrow">Total TTC</p>
              <p className="lg-v2-kpi-value mt-3 text-[32px] leading-none">
                {totalTTC.toFixed(2)}€
              </p>
              <p className="mt-1 text-xs lg-v2-text-subtle">
                {lignes.length === 0
                  ? "Aucune ligne ajoutée"
                  : `${lignes.length} ligne${lignes.length > 1 ? "s" : ""} · TVA ${tva}% par défaut`}
              </p>

              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="lg-v2-text-muted">Sous-total HT</dt>
                  <dd className="font-medium tabular-nums lg-v2-text">{totalHTBrut.toFixed(2)}€</dd>
                </div>
                {remisePct > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="lg-v2-text-muted">Remise ({remisePct}%)</dt>
                    <dd className="font-medium tabular-nums text-[var(--v2-warning)]">
                      −{remiseEur.toFixed(2)}€
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <dt className="lg-v2-text-muted">HT net</dt>
                  <dd className="font-medium tabular-nums lg-v2-text">{totalHT.toFixed(2)}€</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="lg-v2-text-muted">TVA</dt>
                  <dd className="font-medium tabular-nums lg-v2-text">{tvaTotalEur.toFixed(2)}€</dd>
                </div>
                {acompteEur > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="lg-v2-text-muted">Acompte versé</dt>
                    <dd className="font-medium tabular-nums text-[var(--v2-success)]">
                      −{acompteEur.toFixed(2)}€
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t lg-v2-divider pt-2">
                  <dt className="font-semibold lg-v2-text-strong">À régler</dt>
                  <dd className="font-bold tabular-nums lg-v2-text-strong">
                    {aReglerEur.toFixed(2)}€
                  </dd>
                </div>
              </dl>

              {draftLabel ? (
                <p
                  className="mt-5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] lg-v2-text-subtle"
                  style={{ backgroundColor: "var(--v2-panel-muted)" }}
                >
                  {draftStatus === "saving" ? (
                    <Loader2 size={11} className="animate-spin" aria-hidden />
                  ) : (
                    <Save size={11} aria-hidden />
                  )}
                  {draftLabel}
                </p>
              ) : null}
            </div>

            {/* Actions */}
            <div className="lg-v2-panel space-y-2 p-5">
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={sending || !canSubmit}
                className="lg-v2-btn lg-v2-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                ) : (
                  <Save size={14} aria-hidden />
                )}
                Créer la facture
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={sending || !canSubmit}
                className="lg-v2-btn lg-v2-btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                ) : (
                  <Send size={14} aria-hidden />
                )}
                Créer et envoyer par email
              </button>
              {!canSubmit ? (
                <p className="px-1 pt-1 text-center text-xs lg-v2-text-subtle">
                  {!hasClient ? "Sélectionnez un client pour activer." : "Ajoutez au moins une ligne."}
                </p>
              ) : null}
              <Link
                href="/factures"
                className="lg-v2-btn lg-v2-btn-ghost w-full"
              >
                <ArrowLeft size={14} aria-hidden />
                Annuler
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* New client dialog */}
      <MobileDialog open={showNewClient} onClose={() => setShowNewClient(false)}
        title="Nouveau client" tone="accent"
        actions={
          <button onClick={handleCreateClient}
            className="w-full rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white">
            Créer le client
          </button>
        }>
        <div className="space-y-3">
          {(["nom", "email", "telephone", "adresse"] as const).map((field) => (
            <input key={field} value={newClient[field]}
              onChange={(e) => setNewClient({ ...newClient, [field]: e.target.value })}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          ))}
        </div>
      </MobileDialog>

      {/* AI dialog */}
      <MobileDialog open={showShowAI} onClose={() => !aiGenerating && setShowShowAI(false)}
        title="Générer avec l'IA" description="Décrivez la facture et l'IA génère les lignes." tone="accent"
        actions={
          <button onClick={generateWithAI} disabled={aiGenerating || !aiPrompt.trim()}
            className="w-full rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2">
            {aiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {aiGenerating ? "Génération..." : "Générer"}
          </button>
        }>
        <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Ex: rénovation salle de bain complète..."
          className="h-32 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
      </MobileDialog>
    </ClientSubpageShell>
  );
}
