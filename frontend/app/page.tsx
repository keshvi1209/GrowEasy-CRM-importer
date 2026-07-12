"use client";

import { useCallback, useEffect, useState } from "react";
import Papa from "papaparse";
import toast from "react-hot-toast";
import UploadBox from "@/components/UploadBox";
import CSVPreviewTable from "@/components/CSVPreviewTable";
import CRMTable from "@/components/CRMTable";
import SkippedTable from "@/components/SkippedTable";
import ImportSummaryCards from "@/components/ImportSummary";
import LoadingOverlay from "@/components/LoadingOverlay";
import PipelineStepper from "@/components/PipelineStepper";
import Sidebar from "@/components/Sidebar";
import AppLoadingScreen from "@/components/AppLoadingScreen";
import ThemeToggle from "@/components/ThemeToggle";
import { importCsvFile, ApiError } from "@/services/api";
import { downloadCrmCsv } from "@/utils/csvExport";
import { ImportProgress, ImportResponse, ImportStage, RawCsvRow } from "@/types";

const APP_BOOT_DELAY_MS = 700;

export default function HomePage() {
  const [appReady, setAppReady] = useState(false);
  const [stage, setStage] = useState<ImportStage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawCsvRow[]>([]);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [resultTab, setResultTab] = useState<"imported" | "skipped">("imported");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | undefined>();

  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), APP_BOOT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleFileAccepted = useCallback((accepted: File) => {
    setParseError(null);
    Papa.parse<RawCsvRow>(accepted, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) {
          setParseError("This CSV has no data rows to preview.");
          return;
        }
        setFile(accepted);
        setHeaders(results.meta.fields || []);
        setRows(results.data);
        setStage("preview");
      },
      error: (err) => {
        setParseError(err.message || "Could not parse this CSV file.");
      },
    });
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!file) return;
    setStage("processing");
    setImportProgress(undefined);
    try {
      const response = await importCsvFile(file, setImportProgress);
      setResult(response);
      setStage("result");
      toast.success(
        `Imported ${response.summary.imported} of ${response.summary.total} rows`
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Import failed unexpectedly.";
      toast.error(message);
      setStage("preview");
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setStage("upload");
    setFile(null);
    setHeaders([]);
    setRows([]);
    setResult(null);
    setResultTab("imported");
    setParseError(null);
    setImportProgress(undefined);
  }, []);

  if (!appReady) {
    return <AppLoadingScreen />;
  }

  return (
    <div className="flex min-h-screen bg-canvas dark:bg-graphite-900">
      <Sidebar stage={stage} />
      <main className="min-w-0 flex-1">
        {/* Mobile/tablet top bar -- sidebar branding lives here below lg */}
        <div className="flex items-center justify-between border-b border-graphite-200 bg-white px-4 py-3 dark:border-graphite-800 dark:bg-graphite-800 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500 font-display text-sm font-bold text-graphite-900">
              G
            </div>
            <p className="font-display text-base font-semibold text-graphite-900 dark:text-white">
              GrowEasy
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8 sm:py-12 lg:px-12">
          {/* Header */}
          <header className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-graphite-900 dark:text-white sm:text-3xl lg:text-4xl">
                CSV → CRM Importer
              </h1>
              <p className="mt-2 max-w-2xl text-base text-graphite-500 dark:text-graphite-400">
                Upload a lead export in any layout. The pipeline extracts, maps, and validates it into
                clean GrowEasy CRM records.
              </p>
            </div>
            {stage !== "upload" && (
              <button
                onClick={handleReset}
                className="rounded-md border border-graphite-300 px-4 py-2 text-base font-medium text-graphite-600 transition-colors hover:border-graphite-400 hover:text-graphite-800 dark:border-graphite-600 dark:text-graphite-300 dark:hover:border-graphite-500 dark:hover:text-white"
              >
                Start over
              </button>
            )}
          </header>

          {/* Pipeline stepper (mobile fallback -- sidebar carries this on lg+) */}
          <div className="mb-8 rounded-lg border border-graphite-200 bg-white px-4 py-5 dark:border-graphite-700 dark:bg-graphite-800 sm:mb-10 sm:px-6 lg:hidden">
            <PipelineStepper stage={stage} />
          </div>

          {/* Stage: Upload */}
          {stage === "upload" && (
            <section className="animate-fade-in">
              <UploadBox onFileAccepted={handleFileAccepted} />
              {parseError && (
                <p className="mt-3 text-base text-rust-700 dark:text-rust-200">{parseError}</p>
              )}
            </section>
          )}

          {/* Stage: Preview */}
          {stage === "preview" && (
            <section className="animate-fade-in space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-semibold text-graphite-800 dark:text-graphite-100">
                    Preview
                  </h2>
                  <p className="truncate text-base text-graphite-500 dark:text-graphite-400">
                    {file?.name} — nothing has been sent to the AI yet. Review it, then confirm.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleReset}
                    className="rounded-md border border-graphite-300 px-5 py-2.5 text-base font-medium text-graphite-600 hover:border-graphite-400 hover:text-graphite-800 dark:border-graphite-600 dark:text-graphite-300 dark:hover:border-graphite-500 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="rounded-md bg-teal-700 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-teal-900 dark:bg-teal-600 dark:hover:bg-teal-500"
                  >
                    Confirm import
                  </button>
                </div>
              </div>
              <CSVPreviewTable headers={headers} rows={rows} />
            </section>
          )}

          {/* Stage: Processing */}
          {stage === "processing" && (
            <section className="animate-fade-in">
              <LoadingOverlay fileName={file?.name} progress={importProgress} />
            </section>
          )}

          {/* Stage: Result */}
          {stage === "result" && result && (
            <section className="animate-fade-in space-y-6">
              <ImportSummaryCards summary={result.summary} />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1 rounded-md border border-graphite-200 bg-white p-1 dark:border-graphite-700 dark:bg-graphite-800">
                  <button
                    onClick={() => setResultTab("imported")}
                    className={`rounded px-4 py-2 text-base font-medium transition-colors ${
                      resultTab === "imported"
                        ? "bg-graphite-800 text-white dark:bg-teal-600"
                        : "text-graphite-600 hover:text-graphite-800 dark:text-graphite-400 dark:hover:text-graphite-100"
                    }`}
                  >
                    Imported ({result.summary.imported})
                  </button>
                  <button
                    onClick={() => setResultTab("skipped")}
                    className={`rounded px-4 py-2 text-base font-medium transition-colors ${
                      resultTab === "skipped"
                        ? "bg-graphite-800 text-white dark:bg-teal-600"
                        : "text-graphite-600 hover:text-graphite-800 dark:text-graphite-400 dark:hover:text-graphite-100"
                    }`}
                  >
                    Skipped ({result.summary.skipped})
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleReset}
                    className="rounded-md border border-graphite-300 px-5 py-2.5 text-base font-medium text-graphite-600 hover:border-graphite-400 hover:text-graphite-800 dark:border-graphite-600 dark:text-graphite-300 dark:hover:border-graphite-500 dark:hover:text-white"
                  >
                    Import another file
                  </button>
                  <button
                    onClick={() => downloadCrmCsv(result.records)}
                    disabled={result.records.length === 0}
                    className="rounded-md bg-teal-700 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-teal-900 disabled:cursor-not-allowed disabled:bg-graphite-300 dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-graphite-700"
                  >
                    Download CRM CSV
                  </button>
                </div>
              </div>

              {resultTab === "imported" ? (
                <CRMTable records={result.records} />
              ) : (
                <SkippedTable skipped={result.skipped} />
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
