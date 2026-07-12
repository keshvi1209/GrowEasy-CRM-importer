import pLimit from "p-limit";
import { RawCsvRow, CRMRecord, SkippedRecord, ImportResponse } from "../types";
import { extractBatch, AIServiceError } from "./aiService";
import { sanitizeRecord, hasContactInfo } from "../utils/validators";

// Larger batches mean fewer AI requests per file -- important because
// Gemini's free tier caps requests *per day*, not just per minute, so
// request count (not just concurrency) is what determines how large a
// file can be processed at all.
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 100);
const AI_CONCURRENCY = Number(process.env.AI_CONCURRENCY || 6);
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3);

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries a single batch call with exponential backoff. */
async function extractBatchWithRetry(
  rows: RawCsvRow[],
  startIndex: number,
  onAttempt?: (attempt: number, error?: Error) => void
) {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await extractBatch(rows, startIndex);
      onAttempt?.(attempt);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Unknown AI error");
      onAttempt?.(attempt, lastError);
      if (attempt < MAX_RETRIES) {
        await sleep(500 * 2 ** (attempt - 1)); // 500ms, 1s, 2s...
      }
    }
  }
  throw lastError ?? new AIServiceError("Batch failed for an unknown reason.");
}

/**
 * Runs the full pipeline: chunk rows into batches, send each batch to the
 * AI with bounded concurrency, retry failures, and reconcile the results
 * (including rows the model may have silently dropped) into a single
 * ImportResponse.
 */
export async function processRows(
  rows: RawCsvRow[],
  onBatchSettled?: () => void
): Promise<ImportResponse> {
  const batches = chunk(rows, BATCH_SIZE);
  const limit = pLimit(AI_CONCURRENCY);

  const records: CRMRecord[] = [];
  const skipped: SkippedRecord[] = [];
  let failedBatches = 0;

  const tasks = batches.map((batchRows, batchIdx) =>
    limit(async () => {
      const startIndex = batchIdx * BATCH_SIZE;
      // Track which rowIndexes in this batch we actually get a verdict for,
      // so we can flag anything the model silently dropped.
      const seen = new Set<number>();

      try {
        const results = await extractBatchWithRetry(batchRows, startIndex);

        for (const result of results) {
          seen.add(result.rowIndex);
          const originalRow = rows[result.rowIndex];
          if (!originalRow) continue; // AI hallucinated an out-of-range index

          if (result.skip) {
            skipped.push({
              row: originalRow,
              rowIndex: result.rowIndex,
              reason: result.skipReason || "Skipped by AI (no reason given).",
            });
            continue;
          }

          const sanitized = sanitizeRecord(result.record ?? {});

          // Defense in depth: even if the AI marked skip=false, re-check
          // the hard "must have email or phone" rule ourselves.
          if (!hasContactInfo(sanitized)) {
            skipped.push({
              row: originalRow,
              rowIndex: result.rowIndex,
              reason: "No valid email or phone number after validation.",
            });
            continue;
          }

          records.push(sanitized);
        }

        // Any row in this batch the model didn't return a verdict for.
        for (let i = 0; i < batchRows.length; i++) {
          const rowIndex = startIndex + i;
          if (!seen.has(rowIndex)) {
            skipped.push({
              row: rows[rowIndex],
              rowIndex,
              reason: "AI did not return a result for this row.",
            });
          }
        }
      } catch (err) {
        failedBatches++;
        const message =
          err instanceof Error ? err.message : "Unknown processing error.";
        // The whole batch failed after retries -- skip every row in it with
        // a clear reason rather than losing them silently.
        for (let i = 0; i < batchRows.length; i++) {
          const rowIndex = startIndex + i;
          skipped.push({
            row: rows[rowIndex],
            rowIndex,
            reason: `AI batch failed after ${MAX_RETRIES} attempts: ${message}`,
          });
        }
      } finally {
        onBatchSettled?.();
      }
    })
  );

  await Promise.allSettled(tasks);

  // Sort skipped by original row order for a stable, readable UI.
  skipped.sort((a, b) => a.rowIndex - b.rowIndex);

  return {
    records,
    skipped,
    summary: {
      total: rows.length,
      imported: records.length,
      skipped: skipped.length,
      batches: batches.length,
      failedBatches,
    },
  };
}
