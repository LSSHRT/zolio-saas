"use client";

import { useEffect, useState, useRef, use, Suspense } from "react";
import dynamic from "next/dynamic";
const SignaturePad = dynamic(() => import("@/components/SignaturePad"), { ssr: false });
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, PenTool, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

function SignerDevisContent({ params }: { params: Promise<{ numero: string }> }) {
  const unwrappedParams = use(params);
  const numero = unwrappedParams.numero;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [devis, setDevis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const sigCanvas = useRef<any>(null);

  useEffect(() => {
    if (!token) {
      setError("Lien invalide ou expiré");
      setLoading(false);
      return;
    }

    fetch(`/api/public/devis/${numero}?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setDevis(data);
      })
      .catch(() => setError("Erreur de connexion"))
      .finally(() => setLoading(false));
  }, [numero, token]);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const save = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Veuillez dessiner votre signature avant de valider.");
      return;
    }
    setSigning(true);
    try {
      if (!token) {
        alert("Lien invalide ou expiré");
        return;
      }
      const signatureBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
      const res = await fetch(`/api/public/devis/${numero}?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureBase64 }),
      });
      if (res.ok) {
        setSuccess(true);
        import("canvas-confetti").then((confetti) => {
          confetti.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        });
      } else {
        alert("Erreur lors de l'enregistrement de la signature");
      }
    } catch (e) {
      alert("Erreur réseau");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !devis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Document introuvable</h1>
        <p className="text-slate-500 mt-2">{error || "Ce devis n'existe pas."}</p>
      </div>
    );
  }

  if (success || devis.statut === "Accepté" || devis.signature) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </motion.div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Devis Signé !</h1>
        <p className="text-slate-500">Le devis n°{numero} a été validé avec succès.</p>
        <p className="text-slate-500 mt-2">Vous pouvez fermer cette page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            {devis.entreprise?.logo ? (
              <img src={devis.entreprise.logo} alt="Logo" className="w-12 h-12 object-contain rounded-xl" />
            ) : (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: devis.entreprise?.color ? `${devis.entreprise.color}20` : '#ede9fe' }}>
                <PenTool className="w-6 h-6" style={{ color: devis.entreprise?.color || '#7c3aed' }} />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{devis.entreprise?.nom || "Signature en ligne"}</h1>
              <p className="text-slate-500 text-sm">Devis n°{numero}</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 mb-6 space-y-3 border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Client :</span>
              <span className="font-semibold text-slate-900 dark:text-white">{devis.nomClient}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Montant Total :</span>
              <span className="font-bold text-lg" style={{ color: devis.entreprise?.color || '#7c3aed' }}>{devis.totalTTC} €</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="font-medium text-slate-700 dark:text-slate-300">Votre signature</label>
              <button onClick={clear} className="text-xs font-medium hover:opacity-80" style={{ color: devis.entreprise?.color || '#7c3aed' }}>Effacer</button>
            </div>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <SignaturePad 
                ref={sigCanvas} 
                penColor="black"
                canvasProps={{ className: "w-full h-48 cursor-crosshair" }} 
              />
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              En signant ce document, vous acceptez les conditions générales de vente.
            </p>
          </div>

          <button 
            onClick={save} 
            disabled={signing}
            className="w-full flex items-center justify-center gap-2 text-white py-4 rounded-2xl font-bold transition-all disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: devis.entreprise?.color || '#7c3aed' }}
          >
            {signing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {signing ? "Enregistrement..." : "Valider et Signer"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignerDevis({ params }: { params: Promise<{ numero: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <SignerDevisContent params={params} />
    </Suspense>
  );
}
