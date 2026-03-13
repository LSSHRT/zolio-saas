"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Save, Building2, MapPin, Phone, FileDigit, Image as ImageIcon, CreditCard, Scale, Palette, Gift, Copy } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ParametresEntreprise() {
  const { isLoaded, user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    companyName: (user?.unsafeMetadata?.companyName as string) || (user?.publicMetadata?.companyName as string) || "",
    companyAddress: (user?.unsafeMetadata?.companyAddress as string) || (user?.publicMetadata?.companyAddress as string) || "",
    companyPhone: (user?.unsafeMetadata?.companyPhone as string) || (user?.publicMetadata?.companyPhone as string) || "",
    companySiret: (user?.unsafeMetadata?.companySiret as string) || (user?.publicMetadata?.companySiret as string) || "",
    companyLogo: (user?.unsafeMetadata?.companyLogo as string) || (user?.publicMetadata?.companyLogo as string) || "",
    companyIban: (user?.unsafeMetadata?.companyIban as string) || (user?.publicMetadata?.companyIban as string) || "",
    companyBic: (user?.unsafeMetadata?.companyBic as string) || (user?.publicMetadata?.companyBic as string) || "",
    companyStatut: (user?.unsafeMetadata?.companyStatut as string) || (user?.publicMetadata?.companyStatut as string) || "",
    companyAssurance: (user?.unsafeMetadata?.companyAssurance as string) || (user?.publicMetadata?.companyAssurance as string) || "",
    companyLegal: (user?.unsafeMetadata?.companyLegal as string) || (user?.publicMetadata?.companyLegal as string) || "",
    companyCgv: (user?.unsafeMetadata?.companyCgv as string) || (user?.publicMetadata?.companyCgv as string) || "",
    companyColor: (user?.unsafeMetadata?.companyColor as string) || (user?.publicMetadata?.companyColor as string) || "#0ea5e9",
    companyGoogleReview: (user?.unsafeMetadata?.companyGoogleReview as string) || (user?.publicMetadata?.companyGoogleReview as string) || "",
    referredBy: (user?.unsafeMetadata?.referredBy as string) || (user?.publicMetadata?.referredBy as string) || "",
  });

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  // Update initial form data when user loads (if not already set)
  if (user && formData.companyName === "" && formData.companyAddress === "" && formData.companyPhone === "" && formData.companySiret === "" && formData.companyLogo === "" && formData.companyIban === "") {
    const meta = user.unsafeMetadata || {};
    const pubMeta = user.publicMetadata || {};
    if (meta.companyName || pubMeta.companyName || meta.companyAddress || pubMeta.companyAddress || meta.companyPhone || pubMeta.companyPhone || meta.companySiret || pubMeta.companySiret) {
      setFormData({
        companyName: (meta.companyName as string) || (pubMeta.companyName as string) || "",
        companyAddress: (meta.companyAddress as string) || (pubMeta.companyAddress as string) || "",
        companyPhone: (meta.companyPhone as string) || (pubMeta.companyPhone as string) || "",
        companySiret: (meta.companySiret as string) || (pubMeta.companySiret as string) || "",
        companyLogo: (meta.companyLogo as string) || (pubMeta.companyLogo as string) || "",
        companyIban: (meta.companyIban as string) || (pubMeta.companyIban as string) || "",
        companyBic: (meta.companyBic as string) || (pubMeta.companyBic as string) || "",
        companyStatut: (meta.companyStatut as string) || (pubMeta.companyStatut as string) || "",
        companyAssurance: (meta.companyAssurance as string) || (pubMeta.companyAssurance as string) || "",
        companyLegal: (meta.companyLegal as string) || (pubMeta.companyLegal as string) || "",
        companyCgv: (meta.companyCgv as string) || (pubMeta.companyCgv as string) || "",
        companyColor: (meta.companyColor as string) || (pubMeta.companyColor as string) || "#0ea5e9",
        companyGoogleReview: (meta.companyGoogleReview as string) || (pubMeta.companyGoogleReview as string) || "",
        referredBy: (meta.referredBy as string) || (pubMeta.referredBy as string) || "",
      });
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          companyPhone: formData.companyPhone,
          companySiret: formData.companySiret,
          companyLogo: formData.companyLogo,
          companyIban: formData.companyIban,
          companyBic: formData.companyBic,
          companyStatut: formData.companyStatut,
          companyAssurance: formData.companyAssurance,
          companyLegal: formData.companyLegal,
          companyCgv: formData.companyCgv,
          companyColor: formData.companyColor,
          companyGoogleReview: formData.companyGoogleReview,
          referredBy: formData.referredBy,
        }
      });
      setMessage({ type: "success", text: "Paramètres enregistrés avec succès !" });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Une erreur est survenue lors de l'enregistrement." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <div className="bg-white dark:bg-gray-800 dark:bg-slate-800 border-b dark:border-slate-700 px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <Link href="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-white">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Paramètres de l'entreprise</h1>
      </div>

      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full px-4 pt-6">
        <div className="bg-violet-50 dark:bg-violet-900/20 text-violet-800 dark:text-violet-300 p-4 rounded-xl mb-6 text-sm">
          Ces informations apparaîtront automatiquement sur tous les devis et factures que vous générez.
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              Nom de l'entreprise
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Ex: Maçonnerie Dupont"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              Adresse postale
            </label>
            <textarea
              name="companyAddress"
              value={formData.companyAddress}
              onChange={handleChange}
              rows={3}
              placeholder="123 rue de la République&#10;75001 Paris"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              Téléphone
            </label>
            <input
              type="tel"
              name="companyPhone"
              value={formData.companyPhone}
              onChange={handleChange}
              placeholder="06 12 34 56 78"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <FileDigit className="w-4 h-4 text-slate-400" />
              Numéro de SIRET
            </label>
            <input
              type="text"
              name="companySiret"
              value={formData.companySiret}
              onChange={handleChange}
              placeholder="123 456 789 00012"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              Statut juridique et Capital
            </label>
            <input
              type="text"
              name="companyStatut"
              value={formData.companyStatut}
              onChange={handleChange}
              placeholder="Ex: SARL au capital de 5 000€ - RCS Paris"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-400" />
              Assurance professionnelle (ex: Décennale)
            </label>
            <input
              type="text"
              name="companyAssurance"
              value={formData.companyAssurance}
              onChange={handleChange}
              placeholder="Ex: Assurance décennale MMA N°12345678"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              Lien du Logo (URL de l'image)
            </label>
            <input
              type="url"
              name="companyLogo"
              value={formData.companyLogo}
              onChange={handleChange}
              placeholder="https://mon-site.com/logo.png"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-400" />
              Couleur principale des documents
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                name="companyColor"
                value={formData.companyColor}
                onChange={handleChange}
                className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Couleur de l'en-tête (Défaut: Bleu)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <span className="text-xl">⭐</span>
              Lien de la page Avis Google
            </label>
            <input
              type="url"
              name="companyGoogleReview"
              value={formData.companyGoogleReview}
              onChange={handleChange}
              placeholder="https://g.page/r/.../review"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-slate-400 mt-2">Ce lien sera utilisé pour proposer au client de laisser un avis lorsque sa facture sera payée.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                IBAN
              </label>
              <input
                type="text"
                name="companyIban"
                value={formData.companyIban}
                onChange={handleChange}
                placeholder="FR76 1234..."
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                BIC
              </label>
              <input
                type="text"
                name="companyBic"
                value={formData.companyBic}
                onChange={handleChange}
                placeholder="ABCDEF12"
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-400" />
              Pénalités de retard et autres mentions légales
            </label>
            <textarea
              name="companyLegal"
              value={formData.companyLegal}
              onChange={handleChange}
              rows={2}
              placeholder="Ex: En cas de retard de paiement, pénalité de 10%."
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Conditions Générales de Vente (CGV)</label>
            <p className="text-xs text-slate-500 mb-2">Ce texte sera ajouté automatiquement en annexe à la fin de tous vos devis.</p>
            <textarea
              name="companyCgv"
              value={formData.companyCgv}
              onChange={handleChange}
              rows={6}
              placeholder="Article 1. Acceptation des conditions...&#10;Article 2. Modalités de paiement..."
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-y"
            />
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold py-4 rounded-xl shadow-lg shadow-violet-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer les paramètres
              </>
            )}
          </button>
        </form>

        {/* Section Parrainage */}
        <div className="mt-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl shadow-lg p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Gift size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Gift className="w-6 h-6 text-violet-200" />
              <h2 className="text-xl font-bold">Parrainez un confrère</h2>
            </div>
            <p className="text-violet-100 mb-6 max-w-md text-sm leading-relaxed">
              Invitez un confrère à utiliser Zolio. S'il s'abonne à la <strong>version PRO</strong>, vous gagnez tous les deux <strong>1 mois d'abonnement gratuit</strong> ! C'est le meilleur moyen de faire grandir notre communauté.
            </p>
            
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 mb-6">
              <p className="text-xs text-violet-200 mb-2 font-medium uppercase tracking-wider">Votre code de parrainage unique</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 font-mono text-xl font-bold bg-white/20 px-4 py-2 rounded-lg text-center tracking-widest">
                  {user.id.slice(-8).toUpperCase()}
                </code>
                <button
                  onClick={() => {
                    const code = user.id.slice(-8).toUpperCase();
                    navigator.clipboard.writeText(`Rejoignez Zolio avec mon code de parrainage ${code} pour gagner 1 mois gratuit sur l'abonnement PRO ! https://zolio.site/sign-up?ref=${code}`);
                    setMessage({ type: "success", text: "Message de parrainage copié !" });
                  }}
                  className="bg-white text-violet-600 p-3 rounded-lg hover:bg-violet-50 transition-colors flex items-center justify-center shadow-sm"
                  title="Copier le code"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>

            {/* Saisir un code de parrain */}
            {!(user?.unsafeMetadata?.referredBy as string || user?.publicMetadata?.referredBy as string) && (
              <div className="bg-black/20 p-4 rounded-xl border border-white/10 mt-4">
                <p className="text-sm font-medium text-white mb-2">Vous avez été parrainé ?</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="referredBy"
                    value={formData.referredBy}
                    onChange={handleChange}
                    placeholder="Entrez le code de votre parrain"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-violet-300 focus:outline-none focus:ring-2 focus:ring-white/50 uppercase"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving || !formData.referredBy}
                    className="bg-white text-violet-600 px-4 py-2 rounded-lg font-medium hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Valider
                  </button>
                </div>
              </div>
            )}
            
            {(user?.unsafeMetadata?.referredBy as string || user?.publicMetadata?.referredBy as string) && (
              <div className="bg-black/20 p-4 rounded-xl border border-white/10 mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div>
                  <p className="text-sm text-green-300 font-medium">Vous avez été parrainé !</p>
                  <p className="text-xs text-white/70 font-mono">Code : {(user.unsafeMetadata.referredBy as string) || (user.publicMetadata.referredBy as string)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-violet-600" />
            Documents Légaux de Zolio
          </h2>
          <div className="flex flex-col gap-3">
            <Link href="/cgv" className="text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 font-medium flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span>Conditions Générales de Vente (CGV)</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link href="/cgu" className="text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 font-medium flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span>Conditions Générales d'Utilisation (CGU)</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link href="/mentions-legales" className="text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 font-medium flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span>Mentions Légales</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link href="/politique-confidentialite" className="text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 font-medium flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span>Politique de Confidentialité</span>
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
