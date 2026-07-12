export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;
export type CRMStatus = (typeof CRM_STATUS_VALUES)[number] | "";

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;
export type DataSource = (typeof DATA_SOURCE_VALUES)[number] | "";

export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CRMStatus;
  crm_note: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

export const CRM_FIELD_ORDER: (keyof CRMRecord)[] = [
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "data_source",
  "possession_time",
  "created_at",
  "crm_note",
  "description",
];

export type RawCsvRow = Record<string, string>;

export interface SkippedRecord {
  row: RawCsvRow;
  rowIndex: number;
  reason: string;
}

export interface ImportSummary {
  total: number;
  imported: number;
  skipped: number;
  batches: number;
  failedBatches: number;
}

export interface ImportResponse {
  records: CRMRecord[];
  skipped: SkippedRecord[];
  summary: ImportSummary;
}

export type ImportStage = "upload" | "preview" | "processing" | "result";

export interface ImportJobStarted {
  jobId: string;
  totalRows: number;
  totalBatches: number;
}

export interface ImportJobStatus {
  status: "processing" | "done" | "error";
  totalRows: number;
  totalBatches: number;
  processedBatches: number;
  result?: ImportResponse;
  error?: string;
}

export interface ImportProgress {
  processedBatches: number;
  totalBatches: number;
}
