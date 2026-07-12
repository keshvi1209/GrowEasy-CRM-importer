"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";
import toast from "react-hot-toast";

interface UploadBoxProps {
  onFileAccepted: (file: File) => void;
}

const MAX_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || 15);

export default function UploadBox({ onFileAccepted }: UploadBoxProps) {
  const [isDragReject, setIsDragReject] = useState(false);

  const onDrop = useCallback(
    (accepted: File[], rejected: import("react-dropzone").FileRejection[]) => {
      if (rejected.length > 0) {
        const reason = rejected[0].errors[0]?.message || "File was rejected.";
        toast.error(reason);
        setIsDragReject(true);
        setTimeout(() => setIsDragReject(false), 1200);
        return;
      }
      if (accepted.length > 0) {
        onFileAccepted(accepted[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        "group relative cursor-pointer rounded-lg border-2 border-dashed px-4 py-12 text-center transition-all sm:px-8 sm:py-16",
        isDragActive && !isDragReject && "border-teal-600 bg-teal-100 dark:bg-teal-900/20",
        isDragReject && "border-rust-500 bg-rust-100 dark:bg-rust-500/15",
        !isDragActive &&
          !isDragReject &&
          "border-graphite-300 bg-white hover:border-teal-500 hover:bg-teal-100/40 dark:border-graphite-700 dark:bg-graphite-800 dark:hover:bg-teal-900/10"
      )}
    >
      <input {...getInputProps()} aria-label="Upload CSV file" />

      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div
          className={clsx(
            "flex h-14 w-14 items-center justify-center rounded-full border transition-colors",
            isDragActive
              ? "border-teal-600 bg-teal-600 text-white"
              : "border-graphite-300 bg-graphite-100 text-graphite-600 group-hover:border-teal-500 group-hover:text-teal-700 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-300"
          )}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div>
          <p className="font-display text-lg font-semibold text-graphite-800 dark:text-graphite-100">
            {isDragActive ? "Drop it right here" : "Drag your lead CSV here"}
          </p>
          <p className="mt-1 text-sm text-graphite-500 dark:text-graphite-400">
            Facebook Lead Ads, Google Ads, Excel exports, real-estate CRMs — any header layout works.
          </p>
        </div>

        <button
          type="button"
          className="mt-1 rounded-md bg-graphite-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-graphite-900 dark:bg-graphite-700 dark:hover:bg-graphite-600"
        >
          Choose file
        </button>

        <p className="font-mono text-xs text-graphite-400 dark:text-graphite-500">
          .csv · up to {MAX_SIZE_MB}MB
        </p>
      </div>
    </div>
  );
}
