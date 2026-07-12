import clsx from "clsx";
import { CRMStatus } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP:
    "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-700/50",
  SALE_DONE: "bg-teal-600 text-white border-teal-600 dark:bg-teal-500 dark:border-teal-500",
  DID_NOT_CONNECT:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30",
  BAD_LEAD:
    "bg-rust-100 text-rust-700 border-rust-200 dark:bg-rust-500/15 dark:text-rust-200 dark:border-rust-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "Follow up",
  SALE_DONE: "Sale done",
  DID_NOT_CONNECT: "Did not connect",
  BAD_LEAD: "Bad lead",
};

export default function StatusBadge({ status }: { status: CRMStatus }) {
  if (!status) {
    return <span className="font-mono text-xs text-graphite-400 dark:text-graphite-500">—</span>;
  }
  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
