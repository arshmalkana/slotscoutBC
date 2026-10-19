import { execFileSync } from "node:child_process";

/** PDF to text with poppler's pdftotext (installed in the ingest image). Returns null when unavailable. */
export function pdfToText(file: string): string | null {
  try {
    return execFileSync("pdftotext", ["-layout", "-enc", "UTF-8", file, "-"], { maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
  } catch {
    return null;
  }
}
