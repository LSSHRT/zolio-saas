import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex-col justify-center px-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">Créez votre compte Zolio</h1>
          <p className="text-xl text-teal-100 mb-8 max-w-lg">Commencez dès maintenant. Vos 3 premiers devis sont offerts.</p>
          <ul className="space-y-3 font-medium">
            <li className="flex items-center"><span className="mr-2">✓</span> Devis illimités en pro</li>
            <li className="flex items-center"><span className="mr-2">✓</span> Transformation en factures</li>
            <li className="flex items-center"><span className="mr-2">✓</span> Catalogue de prestations intégré</li>
          </ul>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-8">
        <SignUp />
      </div>
    </div>
  );
}
