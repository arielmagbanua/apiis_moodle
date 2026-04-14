import { NextResponse } from "next/server";
import axios from "axios";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const FUNCTIONS_URL =
  "https://extractdatafrommoodlequizresults-u7tht74a7q-as.a.run.app";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 },
    );
  }

  const entry = formData.get("file");
  if (!entry || !(entry instanceof File)) {
    return NextResponse.json(
      { error: 'Missing file field "file"' },
      { status: 400 },
    );
  }

  if (entry.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  if (entry.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_BYTES} bytes)` },
      { status: 413 },
    );
  }

  const name = entry.name.toLowerCase();
  const typeOk =
    name.endsWith(".csv") ||
    entry.type === "text/csv" ||
    entry.type === "application/vnd.ms-excel";

  if (!typeOk) {
    return NextResponse.json(
      { error: "Only CSV uploads are accepted" },
      { status: 415 },
    );
  }

  // forward the file to the firebase functions and get the summary
  const body = new FormData();
  body.append("quiz_results", entry);

  const { data } = await axios.post<{
    ok?: boolean;
    error?: string;
    name?: string;
  }>(FUNCTIONS_URL, body);

  return NextResponse.json(data);
}
