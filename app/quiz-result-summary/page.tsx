"use client";

import axios from "axios";
import type { ChangeEvent, DragEvent, SubmitEvent } from "react";
import { useCallback, useRef, useState } from "react";
import QuizSummary, { type QuizResultStats } from "@/components/QuizSummary";

const CSV_ACCEPT = ".csv,text/csv";

function isCsv(file: File) {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return true;
  }

  return file.type === "text/csv" || file.type === "application/vnd.ms-excel";
}

export default function QuizResultSummary() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadOk, setUploadOk] = useState<QuizResultStats | null>(null);
  const depth = useRef(0);

  const pickFile = useCallback((file: File | undefined) => {
    if (!file || !isCsv(file)) return;
    setSelectedFile(file);
  }, []);

  const onSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      return;
    }

    setUploadError(null);
    setUploadOk(null);
    setIsUploading(true);

    try {
      const body = new FormData();
      body.append("file", selectedFile);

      const { data } = await axios.post<QuizResultStats>(
        "/api/quiz-result-summary/upload",
        body,
      );

      setUploadOk(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const payload = err.response.data as { error?: string };
        setUploadError(
          payload.error ?? `Upload failed (${err.response.status})`,
        );
      } else {
        setUploadError("Network error — try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

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
    <form
      className="flex w-full min-w-0 flex-col items-center justify-center gap-6 text-center"
      onSubmit={onSubmit}
    >
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
        {selectedFile ? (
          <span className="pointer-events-none mt-2 text-sm text-zinc-700">
            Selected: {selectedFile.name}
          </span>
        ) : null}
      </label>
      <div className="flex w-full flex-col items-end justify-center-safe gap-2">
        {uploadError ? (
          <p className="w-full text-left text-sm text-red-600" role="alert">
            {uploadError}
          </p>
        ) : null}
        {uploadOk ? <QuizSummary summary={uploadOk} /> : null}
        <button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 hover:cursor-pointer"
        >
          {isUploading ? "Uploading…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
