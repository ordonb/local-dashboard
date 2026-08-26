export type DataRow = {
  customerName: string;
  value: string;
  stats: string;
  score?: string;
};

export const SECTIONS = ["cm", "vm", "tm", "im"] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_NAMES: Record<Section, string> = {
  cm: "Configuration",
  vm: "Vulnerability",
  tm: "Threat",
  im: "Incident",
};

export function isSection(value: string): value is Section {
  return SECTIONS.includes(value as Section);
}
