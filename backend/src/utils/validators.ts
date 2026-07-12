import {
  CRMRecord,
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
  CRMStatus,
  DataSource,
} from "../types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The AI is a good guesser, not a source of truth. Every record it returns
 * is re-validated here with deterministic rules before it's allowed into
 * the final import. Anything that fails validation is coerced to a safe
 * empty value rather than trusted as-is (except email/phone, which are the
 * basis for the skip decision and are re-checked by the caller).
 */

export function sanitizeEmail(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  return EMAIL_REGEX.test(v) ? v : "";
}

export function sanitizePhone(value: string | undefined | null): string {
  const v = (value ?? "").replace(/[^\d]/g, "");
  return v;
}

export function sanitizeCountryCode(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  const digitsOnly = v.replace(/[^\d]/g, "");
  if (!digitsOnly) return "";
  return `+${digitsOnly}`;
}

export function sanitizeCrmStatus(value: string | undefined | null): CRMStatus | "" {
  const v = (value ?? "").trim().toUpperCase();
  return (CRM_STATUS_VALUES as readonly string[]).includes(v)
    ? (v as CRMStatus)
    : "";
}

export function sanitizeDataSource(value: string | undefined | null): DataSource | "" {
  const v = (value ?? "").trim().toLowerCase();
  return (DATA_SOURCE_VALUES as readonly string[]).includes(v)
    ? (v as DataSource)
    : "";
}

export function sanitizeDate(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  const parsed = new Date(v);
  return isNaN(parsed.getTime()) ? "" : v;
}

/** Removes characters that would break single-row CSV re-serialization. */
export function sanitizeText(value: string | undefined | null): string {
  const v = (value ?? "").toString();
  return v.replace(/\r?\n/g, "\\n").trim();
}

/**
 * Builds a fully-sanitized CRMRecord from a raw (untrusted) partial record
 * returned by the AI. Guarantees every key exists and every value passes
 * its field-specific validation.
 */
export function sanitizeRecord(raw: Partial<CRMRecord>): CRMRecord {
  return {
    created_at: sanitizeDate(raw.created_at),
    name: sanitizeText(raw.name),
    email: sanitizeEmail(raw.email),
    country_code: sanitizeCountryCode(raw.country_code),
    mobile_without_country_code: sanitizePhone(raw.mobile_without_country_code),
    company: sanitizeText(raw.company),
    city: sanitizeText(raw.city),
    state: sanitizeText(raw.state),
    country: sanitizeText(raw.country),
    lead_owner: sanitizeText(raw.lead_owner),
    crm_status: sanitizeCrmStatus(raw.crm_status),
    crm_note: sanitizeText(raw.crm_note),
    data_source: sanitizeDataSource(raw.data_source),
    possession_time: sanitizeText(raw.possession_time),
    description: sanitizeText(raw.description),
  };
}

/** A record with neither a valid email nor a valid phone is not importable. */
export function hasContactInfo(record: CRMRecord): boolean {
  return Boolean(record.email) || Boolean(record.mobile_without_country_code);
}
