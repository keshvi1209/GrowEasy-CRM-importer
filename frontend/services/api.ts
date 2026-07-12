import axios, { AxiosError } from "axios";
import { ImportJobStarted, ImportJobStatus, ImportProgress, ImportResponse } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const POLL_INTERVAL_MS = 1500;

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

function toApiError(err: unknown, fallback: string): ApiError {
  const axiosErr = err as AxiosError<{ error?: string }>;
  if (axiosErr.response) {
    return new ApiError(axiosErr.response.data?.error || fallback, axiosErr.response.status);
  }
  if (axiosErr.code === "ECONNABORTED") {
    return new ApiError("The server took too long to respond. Please try again.");
  }
  return new ApiError("Could not reach the import server. Check your connection and the API URL.");
}

async function startImportJob(file: File): Promise<ImportJobStarted> {
  const formData = new FormData();
  formData.append("csv", file);

  try {
    const response = await axios.post<ImportJobStarted>(
      `${API_BASE_URL}/api/import`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        // Only covers upload + CSV parsing, not AI processing -- that
        // happens in the background and is tracked via polling instead.
        timeout: 60 * 1000,
      }
    );
    return response.data;
  } catch (err) {
    throw toApiError(err, "The import request failed.");
  }
}

async function fetchImportStatus(jobId: string): Promise<ImportJobStatus> {
  try {
    const response = await axios.get<ImportJobStatus>(
      `${API_BASE_URL}/api/import/${jobId}`,
      { timeout: 15 * 1000 }
    );
    return response.data;
  } catch (err) {
    throw toApiError(err, "Could not fetch import status.");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Starts an import job and polls until it finishes. Processing is no
 * longer bound to a single HTTP request's lifetime, so files with
 * thousands of rows can take as long as they need without timing out.
 */
export async function importCsvFile(
  file: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResponse> {
  const { jobId, totalBatches } = await startImportJob(file);
  onProgress?.({ processedBatches: 0, totalBatches });

  while (true) {
    await sleep(POLL_INTERVAL_MS);
    const job = await fetchImportStatus(jobId);
    onProgress?.({ processedBatches: job.processedBatches, totalBatches: job.totalBatches });

    if (job.status === "done" && job.result) {
      return job.result;
    }
    if (job.status === "error") {
      throw new ApiError(job.error || "Import failed unexpectedly.");
    }
  }
}
