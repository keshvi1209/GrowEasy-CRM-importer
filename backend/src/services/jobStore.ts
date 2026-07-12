import { ImportResponse } from "../types";

export type ImportJobStatus = "processing" | "done" | "error";

export interface ImportJob {
  id: string;
  status: ImportJobStatus;
  totalRows: number;
  totalBatches: number;
  processedBatches: number;
  createdAt: number;
  result?: ImportResponse;
  error?: string;
}

const JOB_TTL_MS = 60 * 60 * 1000; // 1 hour
const jobs = new Map<string, ImportJob>();

export function createJob(id: string, totalRows: number, totalBatches: number): ImportJob {
  const job: ImportJob = {
    id,
    status: "processing",
    totalRows,
    totalBatches,
    processedBatches: 0,
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): ImportJob | undefined {
  return jobs.get(id);
}

export function incrementProgress(id: string): void {
  const job = jobs.get(id);
  if (!job) return;
  job.processedBatches += 1;
}

export function completeJob(id: string, result: ImportResponse): void {
  const job = jobs.get(id);
  if (!job) return;
  job.status = "done";
  job.result = result;
  job.processedBatches = job.totalBatches;
}

export function failJob(id: string, error: string): void {
  const job = jobs.get(id);
  if (!job) return;
  job.status = "error";
  job.error = error;
}

// Prevent unbounded memory growth from abandoned/completed jobs.
setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}, 10 * 60 * 1000).unref();
