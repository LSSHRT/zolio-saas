import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 text-white flex-col justify-center px-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">Créez votre compte Zolio</h1>
          <p className="text-xl text-violet-100 mb-8 max-w-lg">Commencez dès maintenant. Vos 3 premiers devis sont offerts.</p>
          <ul className="space-y-3 font-medium">
            <li className="flex items-center"><span className="text-orange-400 mr-2">✓</span> Devis illimités en pro</li>
            <li className="flex items-center"><span className="text-orange-400 mr-2">✓</span> Transformation en factures</li>
            <li className="flex items-center"><span className="text-orange-400 mr-2">✓</span> Catalogue de prestations intégré</li>
          </ul>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 dark:bg-gray-900 dark:bg-slate-900 p-8">
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#7c3aed",
              colorText: "#0f172a",
              colorTextSecondary: "#64748b",
              colorBackground: "#ffffff",
              colorInputText: "#0f172a",
              colorInputBackground: "#f8fafc",
              borderRadius: "1rem",
              fontFamily: "inherit",
            },
            elements: {
              rootBox: "w-full max-w-[400px]",
              card: "shadow-xl shadow-violet-500/8 border border-slate-200/60 rounded-2xl",
              headerTitle: "text-slate-950 dark:text-white",
              headerSubtitle: "text-slate-500 dark:text-slate-400",
              socialButtonsBlockButton: "rounded-xl border-slate-200 hover:border-violet-300 transition",
              formButtonPrimary: "rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 shadow-md shadow-violet-500/20",
              formFieldInput: "rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-400/20",
              footerActionLink: "text-violet-600 hover:text-violet-700",
              dividerLine: "bg-slate-200",
              dividerText: "text-slate-400 text-xs",
            },
          }}
        />
      </div>
    </div>
  );
}
