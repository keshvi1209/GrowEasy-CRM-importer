"use client";

import { LayoutDashboard } from "lucide-react";
import clsx from "clsx";
import PipelineStepper from "./PipelineStepper";
import ThemeToggle from "./ThemeToggle";
import { ImportStage } from "@/types";

export default function Sidebar({ stage }: { stage: ImportStage }) {
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col bg-graphite-900 lg:sticky lg:top-0 lg:flex lg:h-screen xl:w-2/12">
      <div className="flex h-full min-h-0 flex-col gap-6 px-5 py-6">
        {/* Logo */}
        <div className="flex min-w-0 items-center gap-3 px-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500 font-display text-base font-bold text-graphite-900 xl:h-14 xl:w-14">
            <p className="font-display text-xl font-semibold leading-tight text-black xl:text-2xl">
              G
            </p>
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold leading-tight text-white xl:text-3xl">
              GrowEasy
            </p>
            <p className="truncate text-sm leading-tight text-graphite-500">CSV to CRM Importer</p>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="flex flex-col gap-1">
          <div
            className={clsx(
              "flex items-center gap-3 rounded-lg bg-teal-500/15 px-4 py-3 text-base font-medium text-teal-300",
              "ring-1 ring-inset ring-teal-500/20"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            CSV Importer
          </div>
        </nav>

        {/* Timeline / flow */}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          <PipelineStepper stage={stage} orientation="vertical" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-graphite-800 px-1 pt-4">
          <p className="text-xs text-graphite-500">v1.0.0</p>
          <ThemeToggle surface="dark" />
        </div>
      </div>
    </aside>
  );
}