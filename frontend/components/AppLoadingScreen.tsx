export default function AppLoadingScreen({
  message = "Loading GrowEasy CSV Importer…",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-4 text-center dark:bg-graphite-900">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-500 font-display text-2xl font-bold text-graphite-900">
        G
      </div>
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-graphite-200 border-t-teal-600 dark:border-graphite-700" />
      </div>
      <p className="font-mono text-xs uppercase tracking-widest text-graphite-400 dark:text-graphite-500">{message}</p>
    </div>
  );
}
