import Link from "next/link";


export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-md text-center">
        <p className="text-base font-semibold text-blue-600 dark:text-blue-400">404</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
          Page introuvable
        </h1>
        <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-400">
          Désolé, nous n&apos;avons pas pu trouver la page que vous recherchez.
        </p>
        <div className="mt-8 flex items-center justify-center gap-x-4">
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Retour à l&apos;accueil
          </Link>
          <Link href="/contact" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  );
}
