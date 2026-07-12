"use client";

import DataTable, { DataTableColumn } from "./DataTable";
import StatusBadge from "./StatusBadge";
import { CRMRecord } from "@/types";

interface CRMTableProps {
  records: CRMRecord[];
}

export default function CRMTable({ records }: CRMTableProps) {
  const columns: DataTableColumn<CRMRecord>[] = [
    { key: "name", header: "Name", width: 170 },
    { key: "email", header: "Email", width: 220, mono: true },
    {
      key: "phone",
      header: "Phone",
      width: 170,
      mono: true,
      render: (r) =>
        r.mobile_without_country_code
          ? `${r.country_code || ""} ${r.mobile_without_country_code}`.trim()
          : "—",
    },
    { key: "company", header: "Company", width: 170 },
    { key: "city", header: "City", width: 140 },
    { key: "state", header: "State", width: 140 },
    {
      key: "crm_status",
      header: "Status",
      width: 150,
      render: (r) => <StatusBadge status={r.crm_status} />,
    },
    { key: "data_source", header: "Source", width: 150, mono: true },
    { key: "lead_owner", header: "Owner", width: 180, mono: true },
    { key: "created_at", header: "Created", width: 170, mono: true },
    { key: "possession_time", header: "Possession", width: 150 },
    { key: "crm_note", header: "Note", width: 260 },
    { key: "description", header: "Description", width: 260 },
  ];

  return <DataTable columns={columns} rows={records} emptyMessage="No records were imported." />;
}
