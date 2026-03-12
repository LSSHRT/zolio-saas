import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 text-white flex-col justify-center px-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">Gérez vos devis comme un pro.</h1>
          <p className="text-xl text-fuchsia-100 mb-8 max-w-lg">Rejoignez des centaines d'artisans qui ont déjà simplifié leur facturation avec Zolio.</p>
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              <img className="w-10 h-10 rounded-full border-2 border-fuchsia-600" src="https://i.pravatar.cc/100?img=11" alt="User" />
              <img className="w-10 h-10 rounded-full border-2 border-fuchsia-600" src="https://i.pravatar.cc/100?img=32" alt="User" />
              <img className="w-10 h-10 rounded-full border-2 border-fuchsia-600" src="https://i.pravatar.cc/100?img=33" alt="User" />
            </div>
            <span className="text-sm font-medium">Recommandé par 500+ artisans</span>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-8">
        <SignIn />
      </div>
    </div>
  );
}
