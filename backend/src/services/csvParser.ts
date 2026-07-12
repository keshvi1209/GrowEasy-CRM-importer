import { parse } from "csv-parse/sync";
import { RawCsvRow } from "../types";

/**
 * Strips a UTF-8 BOM and normalizes weird whitespace/unicode that commonly
 * shows up in exports from Excel, Google Sheets, or ad platforms.
 */
function cleanCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  // Remove zero-width spaces / BOM-ish characters that sneak into exports.
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, "");
  // Collapse repeated whitespace, trim ends.
  str = str.replace(/\s+/g, " ").trim();
  return str;
}

export interface ParsedCsv {
  headers: string[];
  rows: RawCsvRow[];
}

/**
 * Parses raw CSV file contents into an array of plain objects keyed by the
 * CSV's own header row. We deliberately do NOT assume any fixed schema here
 * -- header normalization/mapping is the AI's job downstream.
 */
export function parseCsv(fileBuffer: Buffer): ParsedCsv {
  // Strip BOM at the buffer level before parsing.
  let text = fileBuffer.toString("utf-8");
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  if (!text.trim()) {
    throw new CsvParseError("The uploaded file is empty.");
  }

  let records: Record<string, unknown>[];
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      bom: true,
    });
  } catch (err) {
    throw new CsvParseError(
      `Could not parse CSV: ${err instanceof Error ? err.message : "unknown error"}`
    );
  }

  if (!records.length) {
    throw new CsvParseError("The CSV contains no data rows.");
  }

  const headers = Object.keys(records[0]);
  if (headers.length === 0) {
    throw new CsvParseError("Could not detect any columns in the CSV.");
  }

  const rows: RawCsvRow[] = records.map((record) => {
    const cleaned: RawCsvRow = {};
    for (const [key, value] of Object.entries(record)) {
      cleaned[cleanCell(key)] = cleanCell(value);
    }
    return cleaned;
  });

  return { headers, rows };
}

export class CsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvParseError";
  }
}
