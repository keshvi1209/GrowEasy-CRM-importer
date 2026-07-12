import { ImportSummary } from "@/types";
import clsx from "clsx";

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "positive" | "warning";
}) {
  return (
    <div className="flex-1 rounded-lg border border-graphite-200 bg-white px-5 py-4 dark:border-graphite-700 dark:bg-graphite-800">
      <p className="font-mono text-[11px] uppercase tracking-wider text-graphite-500 dark:text-graphite-400">
        {label}
      </p>
      <p
        className={clsx(
          "mt-1 font-display text-2xl font-semibold sm:text-3xl",
          tone === "positive" && "text-teal-700 dark:text-teal-200",
          tone === "warning" && "text-amber-700 dark:text-amber-200",
          tone === "default" && "text-graphite-800 dark:text-graphite-100"
        )}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default function ImportSummaryCards({ summary }: { summary: ImportSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
      <StatCard label="Total rows" value={summary.total} />
      <StatCard label="Imported" value={summary.imported} tone="positive" />
      <StatCard label="Skipped" value={summary.skipped} tone="warning" />
      <StatCard label="AI batches" value={summary.batches} />
    </div>
  );
}
