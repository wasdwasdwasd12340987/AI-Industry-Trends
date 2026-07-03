import { Router, type IRouter } from "express";
import { GetToolUserGrowthResponseItem } from "@workspace/api-zod";
import { loadCsvDataRows, toNumber } from "../lib/csv";

const router: IRouter = Router();

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

  res.json(data.map((d) => GetToolUserGrowthResponseItem.parse(d)));
});

export default router;
