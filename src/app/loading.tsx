export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">Chargement en cours...</p>
      </div>
    </div>
  );
}
