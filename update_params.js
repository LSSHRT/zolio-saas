const fs = require('fs');

let content = fs.readFileSync('src/app/parametres/page.tsx', 'utf-8');

// Add new imports
content = content.replace(
  'import { Save, Building2, MapPin, Phone, FileDigit } from "lucide-react";',
  'import { Save, Building2, MapPin, Phone, FileDigit, Image as ImageIcon, CreditCard, Scale, Palette } from "lucide-react";'
);

// Add to formData
content = content.replace(
  'companySiret: (user?.unsafeMetadata?.companySiret as string) || (user?.publicMetadata?.companySiret as string) || "",',
  `companySiret: (user?.unsafeMetadata?.companySiret as string) || (user?.publicMetadata?.companySiret as string) || "",
    companyLogo: (user?.unsafeMetadata?.companyLogo as string) || (user?.publicMetadata?.companyLogo as string) || "",
    companyIban: (user?.unsafeMetadata?.companyIban as string) || (user?.publicMetadata?.companyIban as string) || "",
    companyBic: (user?.unsafeMetadata?.companyBic as string) || (user?.publicMetadata?.companyBic as string) || "",
    companyLegal: (user?.unsafeMetadata?.companyLegal as string) || (user?.publicMetadata?.companyLegal as string) || "",
    companyColor: (user?.unsafeMetadata?.companyColor as string) || (user?.publicMetadata?.companyColor as string) || "#0ea5e9",`
);

// Add to condition
content = content.replace(
  'if (user && formData.companyName === "" && formData.companyAddress === "" && formData.companyPhone === "" && formData.companySiret === "") {',
  'if (user && formData.companyName === "" && formData.companyAddress === "" && formData.companyPhone === "" && formData.companySiret === "" && formData.companyLogo === "" && formData.companyIban === "") {'
);

// Add to setFormData block
content = content.replace(
  'companySiret: (meta.companySiret as string) || (pubMeta.companySiret as string) || "",',
  `companySiret: (meta.companySiret as string) || (pubMeta.companySiret as string) || "",
        companyLogo: (meta.companyLogo as string) || (pubMeta.companyLogo as string) || "",
        companyIban: (meta.companyIban as string) || (pubMeta.companyIban as string) || "",
        companyBic: (meta.companyBic as string) || (pubMeta.companyBic as string) || "",
        companyLegal: (meta.companyLegal as string) || (pubMeta.companyLegal as string) || "",
        companyColor: (meta.companyColor as string) || (pubMeta.companyColor as string) || "#0ea5e9",`
);

// Add to update object
content = content.replace(
  'companySiret: formData.companySiret,',
  `companySiret: formData.companySiret,
          companyLogo: formData.companyLogo,
          companyIban: formData.companyIban,
          companyBic: formData.companyBic,
          companyLegal: formData.companyLegal,
          companyColor: formData.companyColor,`
);

// Add UI fields
const uiFields = `
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
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-400" />
              Mentions légales (Bas de page)
            </label>
            <textarea
              name="companyLegal"
              value={formData.companyLegal}
              onChange={handleChange}
              rows={2}
              placeholder="TVA non applicable, art. 293 B du CGI."
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          {message.text`;

content = content.replace('{message.text', uiFields);

fs.writeFileSync('src/app/parametres/page.tsx', content);
