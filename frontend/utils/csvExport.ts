import Papa from "papaparse";
import { CRMRecord, CRM_FIELD_ORDER } from "@/types";

export function downloadCrmCsv(records: CRMRecord[], filename = "groweasy_crm_import.csv") {
  const rows = records.map((r) => {
    const ordered: Record<string, string> = {};
    for (const field of CRM_FIELD_ORDER) {
      ordered[field] = r[field] ?? "";
    }
    return ordered;
  });

  const csv = Papa.unparse(rows, { columns: CRM_FIELD_ORDER as string[] });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
