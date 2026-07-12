"use client";

import { ImportProgress } from "@/types";

export default function LoadingOverlay({
  fileName,
  progress,
}: {
  fileName?: string;
  progress?: ImportProgress;
}) {
  const hasProgress = !!progress && progress.totalBatches > 0;
  const pct = hasProgress
    ? Math.min(100, Math.round((progress!.processedBatches / progress!.totalBatches) * 100))
    : 0;

  return (
    <div className="flex flex-col items-center gap-8 rounded-lg border border-graphite-200 bg-white px-4 py-12 dark:border-graphite-700 dark:bg-graphite-800 sm:px-8 sm:py-16">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-graphite-200 border-t-teal-600 dark:border-graphite-700" />
      </div>

      <div className="text-center">
        <p className="font-display text-lg font-semibold text-graphite-800 dark:text-graphite-100">
          Mapping{fileName ? ` ${fileName}` : " your file"} to CRM format
        </p>
        <p className="mt-1 text-sm text-graphite-500 dark:text-graphite-400">
          {hasProgress
            ? `Batch ${progress!.processedBatches} of ${progress!.totalBatches} — larger files take longer, this can run for several minutes.`
            : "Uploading and parsing your file…"}
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div className="h-2 w-full overflow-hidden rounded-full bg-graphite-100 dark:bg-graphite-700">
          <div
            className="h-full rounded-full bg-teal-600 transition-all duration-500 ease-out"
            style={{ width: hasProgress ? `${pct}%` : "15%" }}
          />
        </div>
        {hasProgress && (
          <p className="mt-2 text-right font-mono text-xs text-graphite-400 dark:text-graphite-500">{pct}%</p>
        )}
      </div>
    </div>
  );
}
