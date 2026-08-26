import path from "node:path";

import { NextResponse } from "next/server";
import { readSheet } from "read-excel-file/node";

import type { DataRow } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WORKBOOK_PATH = path.join(process.cwd(), "data", "incorta_vm_mock.xlsx");
const REQUIRED_COLUMNS = ["customerName", "value", "stats"] as const;
const COLUMN_ALIASES = {
  customerName: ["customername", "customer", "entityname", "entity"],
  value: ["value", "valuee"],
  stats: ["stats", "status", "statuss"],
  score: ["score"], 
} as const;

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function normalizedHeader(value: unknown) {
  return text(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function GET() {
  try {
    const sheet = await readSheet<string>(WORKBOOK_PATH, {
      parseNumber: (value) => value,
    });

    const [headerRow, ...dataRows] = sheet;
    if (!headerRow) {
      return NextResponse.json({ error: "The Excel sheet is empty." }, { status: 500 });
    }

    const headers = headerRow.map(normalizedHeader);
    const findColumn = (column: keyof typeof COLUMN_ALIASES) =>
      headers.findIndex((header) => COLUMN_ALIASES[column].some((alias) => alias === header));
    const missing = REQUIRED_COLUMNS.filter((column) => findColumn(column) < 0);
    if (missing.length) {
      return NextResponse.json(
        { error: `Excel is missing required columns: ${missing.join(", ")}` },
        { status: 500 },
      );
    }

    const customerIndex = findColumn("customerName");
    const valueIndex = findColumn("value");
    const statsIndex = findColumn("stats");
    const scoreIndex = findColumn("score");

    const rows: DataRow[] = dataRows
      .filter((row) => row.some((cell) => text(cell).trim()))
      .map((row) => {
        const score = scoreIndex >= 0 ? text(row[scoreIndex]).trim() : "";
        return {
          customerName: text(row[customerIndex]).trim(),
          value: text(row[valueIndex]),
          stats: text(row[statsIndex]).trim(),
          ...(score ? { score } : {}),
        };
      });

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to read the Excel data file.", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
