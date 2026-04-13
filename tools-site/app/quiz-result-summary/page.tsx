"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useRef, useState } from "react";

const CSV_ACCEPT = ".csv,text/csv";

function isCsv(file: File) {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return true;
  }

  return file.type === "text/csv" || file.type === "application/vnd.ms-excel";
}

export default function QuizResultSummary() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const depth = useRef(0);

  const pickFile = useCallback((file: File | undefined) => {
    if (!file || !isCsv(file)) return;
    setFileName(file.name);
  }, []);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    pickFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    depth.current += 1;
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    depth.current -= 1;
    if (depth.current <= 0) {
      depth.current = 0;
      setIsDragging(false);
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    depth.current = 0;
    setIsDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-center justify-center gap-6 text-center">
      <label
        htmlFor="csv-upload"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={[
          "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 transition-colors",
          isDragging
            ? "border-zinc-500 bg-zinc-50"
            : "border-gray-200 bg-white hover:border-zinc-300 hover:bg-zinc-50",
        ].join(" ")}
      >
        <input
          id="csv-upload"
          type="file"
          accept={CSV_ACCEPT}
          className="sr-only"
          onChange={onInputChange}
        />
        <span className="pointer-events-none text-sm font-medium text-zinc-900">
          Drop a CSV here or click to browse
        </span>
        <span className="pointer-events-none text-xs text-zinc-500">
          .csv files only
        </span>
        {fileName ? (
          <span className="pointer-events-none mt-2 text-sm text-zinc-700">
            Selected: {fileName}
          </span>
        ) : null}
      </label>
    </div>
  );
}
