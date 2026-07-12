/**
 * Shared type definitions for the CSV -> CRM import pipeline.
 */

// The canonical GrowEasy CRM record shape. All fields are optional strings
// because the AI extraction step must be allowed to leave anything blank
// rather than invent data.
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
  crm_status: CRMStatus | "";
  crm_note: string;
  data_source: DataSource | "";
  possession_time: string;
  description: string;
}

export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;
export type CRMStatus = (typeof CRM_STATUS_VALUES)[number];

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;
export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

export const CRM_FIELDS: (keyof CRMRecord)[] = [
  "created_at",
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
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

// A raw row as parsed from the uploaded CSV, before any AI transformation.
// Keys are whatever the source CSV's headers happen to be.
export type RawCsvRow = Record<string, string>;

// Result of processing a single raw row.
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

// What we ask the AI to return for a single batch: an array of "extractions",
// each tagged with the original row index so we can reconcile skip reasons
// even when the model reorders or drops rows.
export interface AIExtractionResult {
  rowIndex: number;
  skip: boolean;
  skipReason?: string;
  record?: Partial<CRMRecord>;
}
