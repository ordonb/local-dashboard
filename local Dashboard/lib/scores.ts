import { SECTIONS, type DataRow, type Section } from "./data";

function mean(values: Array<number | undefined>) {
  const available = values.filter((value): value is number => value !== undefined);
  return available.length ? available.reduce((total, value) => total + value, 0) / available.length : undefined;
}

export function rowScore(row: DataRow) {
  if (row.score === undefined || row.score.trim() === "") return undefined;
  const score = Number(row.score);
  return Number.isFinite(score) && score >= 0 && score <= 5 ? score : undefined;
}

export function entityAreaScore(rows: DataRow[], customer: string, section: Section) {
  const prefix = section.toUpperCase();
  return mean(rows
    .filter((row) => row.customerName === customer && row.stats.toUpperCase().startsWith(prefix))
    .map(rowScore));
}

export function areaScore(rows: DataRow[], section: Section, customer?: string) {
  if (customer) return entityAreaScore(rows, customer, section);
  const prefix = section.toUpperCase();
  const customers = [...new Set(rows
    .filter((row) => row.stats.toUpperCase().startsWith(prefix))
    .map((row) => row.customerName))];
  return mean(customers.map((entity) => entityAreaScore(rows, entity, section)));
}

export function overallScore(rows: DataRow[], customer?: string) {
  return mean(SECTIONS.map((section) => areaScore(rows, section, customer)));
}

export function formatScore(score: number | undefined) {
  const rounded = score === undefined ? undefined : Math.round((score + Number.EPSILON) * 100) / 100;
  return rounded === undefined ? "— / 5" : `${rounded.toFixed(2)} / 5`;
}
