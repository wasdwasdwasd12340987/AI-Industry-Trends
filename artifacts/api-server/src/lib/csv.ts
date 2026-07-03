import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const DATA_DIR = path.resolve(import.meta.dirname, "..", "data");

const STOP_PREFIXES = [
  "PRIMARY SOURCES",
  "SOURCE:",
  "SOURCES:",
  "•",
  "NOTE:",
  "NOTE",
  "Color",
  "GREEN",
  "All figures",
  "Full sources",
  "Key finding",
];

export function loadCsvDataRows(
  filename: string,
  headerLineIndex: number,
): Record<string, string>[] {
  const safeName = path.basename(filename);
  const filePath = path.join(DATA_DIR, safeName);
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/);
  const relevant = lines.slice(headerLineIndex).join("\n");

  const parsed = Papa.parse<Record<string, string>>(relevant, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    const fatal = parsed.errors.find((e: Papa.ParseError) => e.type !== "FieldMismatch");
    if (fatal) {
      throw new Error(`CSV parse error in ${safeName}: ${fatal.message}`);
    }
  }

  const rows: Record<string, string>[] = [];
  for (const row of parsed.data) {
    const firstVal = (Object.values(row)[0] ?? "").toString().trim();
    if (STOP_PREFIXES.some((p) => firstVal.startsWith(p))) break;
    if (!firstVal) continue;
    rows.push(row);
  }
  return rows;
}

export function toPercent(value: string | undefined): number | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toUpperCase().startsWith("N/A")) return null;
  const num = Number.parseFloat(trimmed);
  if (Number.isNaN(num)) return null;
  return Math.round(num * 1000) / 10;
}

export function toNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed || trimmed.toUpperCase().startsWith("N/A") || trimmed === "—") return null;
  const num = Number.parseFloat(trimmed);
  return Number.isNaN(num) ? null : num;
}
