"use client";

import DataTable, { DataTableColumn } from "./DataTable";
import { SkippedRecord } from "@/types";

export default function SkippedTable({ skipped }: { skipped: SkippedRecord[] }) {
  const columns: DataTableColumn<SkippedRecord>[] = [
    { key: "rowIndex", header: "Row #", width: 80, mono: true, render: (r) => `#${r.rowIndex + 1}` },
    {
      key: "row",
      header: "Original row",
      width: 480,
      render: (r) => (
        <span className="truncate text-graphite-600 dark:text-graphite-300">
          {Object.entries(r.row)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join("  ·  ") || "(empty row)"}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason skipped",
      width: 320,
      render: (r) => <span className="text-rust-700 dark:text-rust-200">{r.reason}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={skipped}
      emptyMessage="Nothing was skipped — every row had usable contact info."
    />
  );
}
