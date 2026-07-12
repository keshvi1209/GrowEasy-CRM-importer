"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: number;
  render?: (row: T) => React.ReactNode;
  mono?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowHeight?: number;
  maxHeight?: number;
  emptyMessage?: string;
}

/**
 * A sticky-header, horizontally + vertically scrollable table with row
 * virtualization so 10k+ row CSVs don't choke the DOM.
 */
export default function DataTable<T>({
  columns,
  rows,
  rowHeight = 40,
  maxHeight = 640,
  emptyMessage = "No rows to display.",
}: DataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalWidth = columns.reduce((sum, c) => sum + (c.width || 180), 0);

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-graphite-200 bg-white text-sm text-graphite-500 dark:border-graphite-700 dark:bg-graphite-800 dark:text-graphite-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="scrollbar-thin relative overflow-auto rounded-md border border-graphite-200 bg-white dark:border-graphite-700 dark:bg-graphite-800"
      style={{ maxHeight }}
    >
      <div style={{ minWidth: totalWidth }}>
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex border-b border-graphite-200 bg-graphite-800 dark:border-graphite-700">
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex-shrink-0 truncate px-3 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-graphite-200"
              style={{ width: col.width || 180 }}
            >
              {col.header}
            </div>
          ))}
        </div>

        {/* Virtualized body */}
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                className={clsx(
                  "absolute left-0 top-0 flex w-full border-b border-graphite-100 text-sm dark:border-graphite-800/60",
                  virtualRow.index % 2 === 0 ? "bg-white dark:bg-graphite-800" : "bg-graphite-100/50 dark:bg-graphite-700/30"
                )}
                style={{
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={clsx(
                      "flex flex-shrink-0 items-center truncate px-3 text-graphite-700 dark:text-graphite-200",
                      col.mono && "font-mono text-[13px]"
                    )}
                    style={{ width: col.width || 180 }}
                    title={typeof col.render === "undefined" ? String((row as never)[col.key] ?? "") : undefined}
                  >
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
