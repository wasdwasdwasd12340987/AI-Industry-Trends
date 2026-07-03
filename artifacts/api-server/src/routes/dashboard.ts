import { Router, type IRouter } from "express";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { loadCsvDataRows, toNumber, toPercent } from "../lib/csv";

const router: IRouter = Router();

router.get("/dashboard/summary", (_req, res) => {
  const industryRows = loadCsvDataRows("5_adoption_by_industry.csv", 2);
  const investmentRows = loadCsvDataRows("4_investment_by_country.csv", 2);
  const kpiRows = loadCsvDataRows("7_key_kpis_summary.csv", 2);

  let leadingIndustry = "";
  let leadingIndustryRate2025 = 0;
  let sum2025 = 0;
  let count2025 = 0;

  for (const row of industryRows) {
    const industry = row["Industry Sector"]?.trim();
    const rate2025 = toPercent(row["2025 %"]);
    if (!industry || rate2025 === null) continue;
    sum2025 += rate2025;
    count2025 += 1;
    if (rate2025 > leadingIndustryRate2025) {
      leadingIndustryRate2025 = rate2025;
      leadingIndustry = industry;
    }
  }

  const averageAdoptionRate2025 =
    count2025 > 0 ? Math.round((sum2025 / count2025) * 10) / 10 : 0;

  const globalTotalRow = investmentRows.find(
    (row) => row["Country / Region"]?.trim() === "Global Total (Corp)",
  );
  const totalPrivateInvestment2024B = toNumber(globalTotalRow?.["2024 ($B)"]) ?? 0;

  const seenMetrics = new Set<string>();
  const kpis: Array<{ metric: string; value: string; period: string; source: string }> = [];
  for (const row of kpiRows) {
    const metric = row["KPI / Metric"]?.trim();
    if (!metric || seenMetrics.has(metric)) continue;
    seenMetrics.add(metric);
    kpis.push({
      metric,
      value: row["Value"]?.trim() ?? "",
      period: row["Year/Period"]?.trim() ?? "",
      source: row["Source"]?.trim() ?? "",
    });
  }

  const data = GetDashboardSummaryResponse.parse({
    totalPrivateInvestment2024B,
    averageAdoptionRate2025,
    leadingIndustry,
    leadingIndustryRate2025,
    kpis,
    lastUpdated: new Date().toISOString(),
    sources: [
      "McKinsey Global Survey on AI / State of AI Reports (2022-2025)",
      "Stanford HAI AI Index 2025",
      "IBM AI Adoption Index",
      "OpenAI official announcements",
      "Ipsos AI Sentiment Survey 2024",
    ],
  });

  res.json(data);
});

export default router;
