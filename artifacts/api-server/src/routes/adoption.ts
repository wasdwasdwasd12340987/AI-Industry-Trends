import { Router, type IRouter } from "express";
import {
  GetIndustryAdoptionResponse,
  GetGlobalAdoptionTrendResponseItem,
  GetBusinessFunctionAdoptionResponseItem,
} from "@workspace/api-zod";
import { loadCsvDataRows, toNumber, toPercent } from "../lib/csv";

const router: IRouter = Router();

const INDUSTRY_YEAR_COLUMNS: Array<{ column: string; year: string }> = [
  { column: "2022 Adoption %", year: "2022" },
  { column: "2023 Adoption %", year: "2023" },
  { column: "Early 2024 %", year: "Early 2024" },
  { column: "Late 2024 %", year: "Late 2024" },
  { column: "2025 %", year: "2025" },
];

router.get("/adoption/industries", (_req, res) => {
  const csvRows = loadCsvDataRows("5_adoption_by_industry.csv", 2);

  const industries: string[] = [];
  const rows: Array<{
    industry: string;
    year: string;
    adoptionRate: number;
    keyDataPoint: string;
  }> = [];
  const summaries: Record<string, string> = {};

  for (const row of csvRows) {
    const industry = row["Industry Sector"]?.trim();
    if (!industry) continue;
    industries.push(industry);

    const keyDataPoint = row["Key Data Points & Source"]?.trim() ?? "";
    for (const { column, year } of INDUSTRY_YEAR_COLUMNS) {
      const adoptionRate = toPercent(row[column]);
      if (adoptionRate === null) continue;
      rows.push({ industry, year, adoptionRate, keyDataPoint });
    }

    const rate2022 = toPercent(row["2022 Adoption %"]);
    const rate2025 = toPercent(row["2025 %"]);
    if (rate2022 !== null && rate2025 !== null) {
      const growth = Math.round((rate2025 - rate2022) * 10) / 10;
      summaries[industry] =
        `Rose from ${rate2022}% (2022) to ${rate2025}% (2025), a ${growth >= 0 ? "+" : ""}${growth}pp change.`;
    }
  }

  const data = GetIndustryAdoptionResponse.parse({ industries, rows, summaries });
  res.json(data);
});

const REAL_TREND_YEARS = new Set(["2022", "2023", "Early 2024", "Late 2024", "2025"]);

router.get("/adoption/global-trend", (_req, res) => {
  const csvRows = loadCsvDataRows("1_mckinsey_org_adoption.csv", 3).filter((row) =>
    REAL_TREND_YEARS.has(row["Year"]?.trim() ?? ""),
  );

  const data = csvRows.map((row) => {
    const point = {
      year: row["Year"]?.trim() ?? "",
      aiAnyFunctionPct: toPercent(row["AI (Any Function) %"]) ?? 0,
      genAiSpecificallyPct: toPercent(row["GenAI Specifically %"]),
      topFunction1: row["Top Function #1"]?.trim() ?? "",
    };
    return GetGlobalAdoptionTrendResponseItem.parse(point);
  });

  res.json(data);
});

const BUSINESS_FUNCTION_YEARS = ["2021", "2022", "2023", "Early 2024", "Late 2024", "2025"];

router.get("/adoption/business-function", (_req, res) => {
  const csvRows = loadCsvDataRows("2_ai_by_business_function.csv", 2);

  const data: Array<{ function: string; year: string; adoptionRate: number }> = [];
  for (const row of csvRows) {
    const fn = row["Business Function"]?.trim();
    if (!fn) continue;
    for (const year of BUSINESS_FUNCTION_YEARS) {
      const adoptionRate = toPercent(row[year]);
      if (adoptionRate === null) continue;
      data.push({ function: fn, year, adoptionRate });
    }
  }

  res.json(data.map((d) => GetBusinessFunctionAdoptionResponseItem.parse(d)));
});

export default router;
export { INDUSTRY_YEAR_COLUMNS, toNumber };
