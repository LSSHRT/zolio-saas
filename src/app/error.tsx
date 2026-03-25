"use client";

import { useEffect } from "react";
import Link from "next/link";


export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
          Oups ! Une erreur est survenue.
        </h1>
        <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-400">
          Nous sommes désolés, mais quelque chose s&apos;est mal passé de notre côté.
        </p>
        <div className="mt-8 flex items-center justify-center gap-x-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={() => reset()}>
            Réessayer
          </button>
          <Link href="/" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
