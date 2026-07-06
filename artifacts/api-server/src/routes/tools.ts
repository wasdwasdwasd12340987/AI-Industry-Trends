import { Router, type IRouter } from "express";
import { GetToolUserGrowthResponseItem } from "@workspace/api-zod";
import { loadCsvDataRows, toNumber } from "../lib/csv";

const router: IRouter = Router();

// Each tool has many historical rows (different dates/metrics); keep one
// representative row per tool: prefer genuine "user" metrics (not
// site-visit/visitor traffic figures) and take the highest reported value.
function dedupeTools<T extends { tool: string; value: number; unit: string }>(rows: T[]): T[] {
  const best = new Map<string, T>();
  for (const row of rows) {
    const isUserMetric = row.unit.toLowerCase().includes("user");
    const existing = best.get(row.tool);
    if (!existing) {
      best.set(row.tool, row);
      continue;
    }
    const existingIsUserMetric = existing.unit.toLowerCase().includes("user");
    if (isUserMetric !== existingIsUserMetric) {
      if (isUserMetric) best.set(row.tool, row);
      continue;
    }
    if (row.value > existing.value) best.set(row.tool, row);
  }
  return Array.from(best.values());
}

router.get("/tools/users", (_req, res) => {
  const csvRows = loadCsvDataRows("3_ai_tool_users_global.csv", 2);

  const data = csvRows
    .map((row) => {
      const tool = row["AI Tool / Platform"]?.trim();
      const value = toNumber(row["Value"]);
      if (!tool || value === null) return null;
      return {
        tool,
        metricType: row["Metric Type"]?.trim() ?? "",
        period: row["Period / Date"]?.trim() ?? "",
        value,
        unit: row["Unit"]?.trim() ?? "",
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  res.json(dedupeTools(data).map((d) => GetToolUserGrowthResponseItem.parse(d)));
});

export default router;
