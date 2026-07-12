import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { parseCsv, CsvParseError } from "../services/csvParser";
import { processRows } from "../services/batchProcessor";
import { AIServiceError } from "../services/aiService";
import { createJob, getJob, incrementProgress, completeJob, failJob } from "../services/jobStore";

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 25);

/**
 * Kicks off an import job and returns immediately with a job id. Large
 * files can take many minutes of AI processing -- that can't be bound to
 * a single HTTP request's lifetime, so the client polls getImportStatus
 * instead of waiting on this response.
 */
export async function startImport(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: "No CSV file was uploaded. Expected field name 'csv'." });
    return;
  }

  let parsed;
  try {
    parsed = parseCsv(req.file.buffer);
  } catch (err) {
    if (err instanceof CsvParseError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Unexpected error while parsing the CSV." });
    return;
  }

  const jobId = randomUUID();
  const totalBatches = Math.ceil(parsed.rows.length / BATCH_SIZE);
  createJob(jobId, parsed.rows.length, totalBatches);

  res.status(202).json({ jobId, totalRows: parsed.rows.length, totalBatches });

  // Fire-and-forget: process in the background, progress polled via jobId.
  processRows(parsed.rows, () => incrementProgress(jobId))
    .then((result) => completeJob(jobId, result))
    .catch((err) => {
      const message =
        err instanceof AIServiceError
          ? `AI extraction failed: ${err.message}`
          : "Unexpected error while processing the CSV.";
      console.error("Import job failed:", err);
      failJob(jobId, message);
    });
}

export function getImportStatus(req: Request, res: Response): void {
  const job = getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Import job not found. It may have expired." });
    return;
  }

  res.status(200).json({
    status: job.status,
    totalRows: job.totalRows,
    totalBatches: job.totalBatches,
    processedBatches: job.processedBatches,
    result: job.result,
    error: job.error,
  });
}

export function healthCheck(_req: Request, res: Response): void {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
}
