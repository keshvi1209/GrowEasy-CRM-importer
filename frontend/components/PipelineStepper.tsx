"use client";

import { ImportStage } from "@/types";
import clsx from "clsx";
import { CheckCircle2, Circle } from "lucide-react";

export const PIPELINE_STEPS: { key: ImportStage; code: string; label: string; description: string }[] = [
  { key: "upload", code: "01_EXTRACT", label: "Upload CSV", description: "Source data ingestion" },
  { key: "preview", code: "02_INSPECT", label: "Preview rows", description: "Schema validation" },
  { key: "processing", code: "03_TRANSFORM", label: "AI mapping", description: "Smart entity alignment" },
  { key: "result", code: "04_LOAD", label: "CRM output", description: "Final pipeline execution" },
];

export default function PipelineStepper({
  stage,
  orientation = "horizontal",
}: {
  stage: ImportStage;
  orientation?: "horizontal" | "vertical";
}) {
  const currentIndex = PIPELINE_STEPS.findIndex((s) => s.key === stage);
  // Once we've reached the final stage, the whole pipeline (including the
  // last step) is complete -- it should show as done, not stuck "active".
  const pipelineComplete = stage === "result";

  // ==========================================
  // VERTICAL ORIENTATION (For the Dark Sidebar)
  // ==========================================
  if (orientation === "vertical") {
    return (
      <div className="flex flex-col gap-3 font-sans">
        {/* Progress Header with Smooth Curve (rounded-2xl) */}
        <div className="flex flex-col gap-3 p-5 rounded-2xl border-graphite-800/80 bg-graphite-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-graphite-400">
              Pipeline Progress
            </span>
            <span className="font-mono text-base font-extrabold text-teal-400">
              {Math.min(Math.max(currentIndex + 1, 0), PIPELINE_STEPS.length)} / {PIPELINE_STEPS.length}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-graphite-800/60 overflow-hidden border border-graphite-700/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_14px_rgba(20,184,166,0.5)] transition-all duration-700 ease-out"
              style={{
                width: `${((Math.max(currentIndex, 0) + 1) / PIPELINE_STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Scaled Stepper Node List with Distinctly Curved Cards (rounded-3xl) */}
        <div className="flex flex-col gap-4">
          {PIPELINE_STEPS.map((step, idx) => {
            const done = idx < currentIndex || (pipelineComplete && idx === currentIndex);
            const active = idx === currentIndex && !pipelineComplete;
            const isLast = idx === PIPELINE_STEPS.length - 1;

            return (
              <div
                key={step.key}
                className={clsx(
                  "relative flex gap-6 rounded-3xl p-5 transition-all duration-300 border",
                  active 
                    ? "bg-graphite-800/40 border-teal-500/50 shadow-[0_12px_36px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm" 
                    : "bg-transparent border-graphite-800/60"
                )}
              >
                {/* Visual Connector Line */}
                {!isLast && (
                  <div className="absolute left-[39px] top-[68px] h-[calc(100%-24px)] w-[2px] bg-graphite-800/80 z-0">
                    <div
                      className={clsx(
                        "w-full bg-gradient-to-b from-teal-500 to-emerald-400 transition-all duration-700 ease-in-out origin-top",
                        done ? "scale-y-100" : "scale-y-0"
                      )}
                    />
                  </div>
                )}

                {/* Main Node Indicator */}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center">
                  {done ? (
                    <CheckCircle2 className="h-[34px] w-[34px] text-teal-400 fill-teal-950/30 drop-shadow-[0_0_8px_rgba(45,212,191,0.35)]" />
                  ) : active ? (
                    <div className="relative flex h-9 w-9 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400/20 opacity-75"></span>
                      <div className="relative h-4 w-4 rounded-full bg-teal-400 ring-[8px] ring-teal-500/20 border border-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.6)]" />
                    </div>
                  ) : (
                    <Circle className="h-6 w-6 text-graphite-600 border border-transparent group-hover:text-graphite-400 transition-colors duration-200" />
                  )}
                </div>

                {/* Content Typography */}
                <div className="flex-1 z-10">
                  <div className="flex flex-col gap-1">
                    <span
                      className={clsx(
                        "font-mono text-[11px] font-bold tracking-widest uppercase transition-colors duration-300",
                        active ? "text-teal-400" : "text-graphite-500"
                      )}
                    >
                      {step.code}
                    </span>
                    <h4
                      className={clsx(
                        "text-lg font-bold tracking-tight transition-colors duration-300",
                        active ? "text-white" : done ? "text-graphite-200" : "text-graphite-400"
                      )}
                    >
                      {step.label}
                    </h4>
                    <p
                      className={clsx(
                        "text-sm mt-0.5 transition-colors duration-300 leading-normal",
                        active ? "text-graphite-300" : "text-graphite-500"
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // HORIZONTAL ORIENTATION (For Content View)
  // ==========================================
  return (
    <div className="w-full p-4 bg-white border border-graphite-200 rounded-3xl font-sans dark:border-graphite-700 dark:bg-graphite-800 sm:p-6">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 right-0 top-[19px] h-[3px] bg-graphite-100 rounded-full dark:bg-graphite-700" />
        <div
          className="absolute left-0 top-[19px] h-[3px] bg-teal-500 transition-all duration-700 ease-out rounded-full"
          style={{
            width: currentIndex <= 0 ? "0%" : `${(currentIndex / (PIPELINE_STEPS.length - 1)) * 100}%`,
          }}
        />

        {PIPELINE_STEPS.map((step, idx) => {
          const done = idx < currentIndex || (pipelineComplete && idx === currentIndex);
          const active = idx === currentIndex && !pipelineComplete;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center text-center"
              style={{ width: `${100 / PIPELINE_STEPS.length}%` }}
            >
              <div
                className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-mono font-bold transition-all duration-300 border-2",
                  done && "border-teal-600 bg-teal-500 text-white shadow-md",
                  active && "border-teal-500 bg-white text-teal-600 shadow-[0_0_16px_rgba(20,184,166,0.35)] ring-4 ring-teal-50/80 dark:bg-graphite-800 dark:ring-teal-900/40",
                  !done && !active && "border-graphite-200 bg-white text-graphite-400 dark:border-graphite-600 dark:bg-graphite-800 dark:text-graphite-500"
                )}
              >
                {done ? "✓" : idx + 1}
              </div>
              <div className="hidden sm:block mt-4 px-2">
                <p
                  className={clsx(
                    "font-mono text-[11px] font-bold tracking-wider uppercase",
                    active ? "text-teal-600" : "text-graphite-400 dark:text-graphite-500"
                  )}
                >
                  {step.code}
                </p>
                <p
                  className={clsx(
                    "text-sm font-bold mt-0.5",
                    active || done ? "text-graphite-800 dark:text-graphite-100" : "text-graphite-400 dark:text-graphite-500"
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}