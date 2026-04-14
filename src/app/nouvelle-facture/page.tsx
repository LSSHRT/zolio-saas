"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  Search,
  Tag,
  Loader2,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ClientBrandMark,
  ClientDesktopNav,
  ClientMobileDock,
  ClientMobileActionsMenu,
  ClientSectionCard,
  ClientSubpageShell,
  type ClientMobileAction,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";
import { getTradeDefinition } from "@/lib/trades";

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
  const { user } = useUser();
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
    }

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

  // Auto-save
  useEffect(() => {
    saveDraft({ lignes, selectedClientId, tva, acompte, remise, step });
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

  const companyTrade = getTradeDefinition(user?.unsafeMetadata?.companyTrade ?? user?.publicMetadata?.companyTrade);
  const activeTradeKey = companyTrade?.key ?? "default";

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

  return (
    <ClientSubpageShell
      title="Nouvelle facture"
      description="Créez une facture directement — sans passer par un devis."
      eyebrow="Création rapide"
      activeNav="tools"
      mobilePrimaryAction={
        <Link href="/factures" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <ArrowLeft size={16} /> Retour
        </Link>
      }
    >
      {/* Steps */}
      <ClientSectionCard className="!p-3">
        <div className="flex items-center gap-1.5">
          {steps.map((s) => (
            <div key={s.num} className={`flex-1 rounded-lg py-1.5 text-center text-xs font-semibold transition ${step === s.num ? "bg-gradient-zolio text-white" : step > s.num ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"}`}>
              {step > s.num ? "✓" : s.num} {s.title}
            </div>
          ))}
        </div>
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
              <button onClick={() => setSelectedClientId("")} className="shrink-0 p-2 text-slate-400"><Trash2 size={16} /></button>
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
          {lignes.map((l, i) => (
            <ClientSectionCard key={l.id} className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <input
                  value={l.nomPrestation}
                  onChange={(e) => updateLine(l.id, { nomPrestation: e.target.value })}
                  placeholder="Nom de la prestation..."
                  className="flex-1 mr-2 bg-transparent border-b border-slate-200 dark:border-slate-700 py-1 text-sm font-medium focus:outline-none focus:border-violet-500 dark:text-white"
                />
                <button onClick={() => removeLine(l.id)} className="text-red-400"><Trash2 size={14} /></button>
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
              <button onClick={() => setStep(step - 1)}
                className="flex items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <ArrowLeft size={16} />
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
