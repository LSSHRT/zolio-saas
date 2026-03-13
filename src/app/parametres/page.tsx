"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Save, Building2, MapPin, Phone, FileDigit, Image as ImageIcon, CreditCard, Scale, Palette } from "lucide-react";
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
      <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <Link href="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-white">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Paramètres de l'entreprise</h1>
      </div>

      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full px-4 pt-6">
        <div className="bg-violet-50 dark:bg-violet-900/20 text-violet-800 dark:text-violet-300 p-4 rounded-xl mb-6 text-sm">
          Ces informations apparaîtront automatiquement sur tous les devis et factures que vous générez.
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 space-y-5">
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

        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
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
