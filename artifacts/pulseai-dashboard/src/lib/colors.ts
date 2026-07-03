export const INDUSTRY_COLORS = [
  "#2563eb", // Blue
  "#7c3aed", // Purple
  "#059669", // Emerald
  "#ea580c", // Orange
  "#db2777", // Pink
  "#0891b2", // Cyan
  "#dc2626", // Red
  "#65a30d", // Teal
  "#ca8a04", // Yellow
  "#4f46e5", // Light Blue
];

const colorMap = new Map<string, string>();
let colorIndex = 0;

export function getIndustryColor(industry: string): string {
  if (!colorMap.has(industry)) {
    colorMap.set(industry, INDUSTRY_COLORS[colorIndex % INDUSTRY_COLORS.length]);
    colorIndex++;
  }
  return colorMap.get(industry)!;
}
