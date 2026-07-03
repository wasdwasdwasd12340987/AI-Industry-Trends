import { Router, type IRouter } from "express";
import { GetForecastResponse } from "@workspace/api-zod";
import type { ErrorResponse } from "@workspace/api-zod";
import { loadCsvDataRows, toPercent } from "../lib/csv";

const router: IRouter = Router();

const YEAR_POINTS: Array<{ column: string; year: number }> = [
  { column: "2022 Adoption %", year: 2022 },
  { column: "2023 Adoption %", year: 2023 },
  { column: "Early 2024 %", year: 2024.0 },
  { column: "Late 2024 %", year: 2024.5 },
  { column: "2025 %", year: 2025 },
];

function linearRegression(points: Array<{ x: number; y: number }>) {
  const n = points.length;
  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

router.get("/forecast", (req, res) => {
  const industryParam = req.query.industry;
  const yearsAheadParam = req.query.yearsAhead;

  const industry = typeof industryParam === "string" ? industryParam : "";
  const yearsAhead = Number.parseInt(String(yearsAheadParam ?? ""), 10);

  if (!industry || Number.isNaN(yearsAhead) || yearsAhead < 1 || yearsAhead > 5) {
    const err: ErrorResponse = {
      error: "industry is required and yearsAhead must be an integer between 1 and 5",
    };
    res.status(400).json(err);
    return;
  }

  const csvRows = loadCsvDataRows("5_adoption_by_industry.csv", 2);
  const industryRow = csvRows.find((row) => row["Industry Sector"]?.trim() === industry);

  if (!industryRow) {
    const err: ErrorResponse = { error: `Unknown industry: ${industry}` };
    res.status(400).json(err);
    return;
  }

  const historical: Array<{ year: number; adoptionRate: number }> = [];
  for (const { column, year } of YEAR_POINTS) {
    const adoptionRate = toPercent(industryRow[column]);
    if (adoptionRate === null) continue;
    historical.push({ year, adoptionRate });
  }

  const { slope, intercept } = linearRegression(
    historical.map((p) => ({ x: p.year, y: p.adoptionRate })),
  );

  const lastYear = Math.max(...historical.map((p) => p.year));
  const projectedYear = 2025 + yearsAhead;

  const projected: Array<{ year: number; adoptionRate: number }> = [];
  for (let year = Math.ceil(lastYear) + 1; year <= projectedYear; year++) {
    const rawValue = slope * year + intercept;
    const adoptionRate = Math.min(100, Math.max(0, Math.round(rawValue * 10) / 10));
    projected.push({ year, adoptionRate });
  }

  const projectedValue =
    projected.length > 0
      ? projected[projected.length - 1]!.adoptionRate
      : Math.min(100, Math.max(0, Math.round((slope * projectedYear + intercept) * 10) / 10));

  const gapTo50 = Math.round((50 - projectedValue) * 10) / 10;

  const data = GetForecastResponse.parse({
    industry,
    historical,
    projected,
    projectedYear,
    projectedValue,
    gapTo50,
    slope: Math.round(slope * 1000) / 1000,
    intercept: Math.round(intercept * 1000) / 1000,
  });

  res.json(data);
});

export default router;
