"use client";

import DataTable, { DataTableColumn } from "./DataTable";
import { RawCsvRow } from "@/types";

interface CSVPreviewTableProps {
  headers: string[];
  rows: RawCsvRow[];
}

export default function CSVPreviewTable({ headers, rows }: CSVPreviewTableProps) {
  const columns: DataTableColumn<RawCsvRow>[] = headers.map((h) => ({
    key: h,
    header: h,
    width: 200,
  }));

  return (
    <div>
      <DataTable columns={columns} rows={rows} />
      <p className="mt-2 font-mono text-xs text-graphite-500 dark:text-graphite-400">
        {rows.length.toLocaleString()} row{rows.length === 1 ? "" : "s"} detected · {headers.length} column
        {headers.length === 1 ? "" : "s"} · no AI processing yet
      </p>
    </div>
  );
}
