import { Router, type IRouter } from "express";
import {
  GetInvestmentByCountryResponseItem,
  GetSentimentByCountryResponseItem,
} from "@workspace/api-zod";
import { loadCsvDataRows, toNumber, toPercent } from "../lib/csv";

const router: IRouter = Router();

const INVESTMENT_YEAR_COLUMNS = [
  "2019 ($B)",
  "2020 ($B)",
  "2021 ($B)",
  "2022 ($B)",
  "2023 ($B)",
  "2024 ($B)",
];

const EXCLUDED_ROWS = new Set(["Global Total (Corp)", "of which: GenAI"]);

router.get("/investment/by-country", (_req, res) => {
  const csvRows = loadCsvDataRows("4_investment_by_country.csv", 2);

  const data: Array<{ country: string; year: string; investmentB: number }> = [];
  for (const row of csvRows) {
    const country = row["Country / Region"]?.trim();
    if (!country || EXCLUDED_ROWS.has(country)) continue;
    for (const column of INVESTMENT_YEAR_COLUMNS) {
      const investmentB = toNumber(row[column]);
      if (investmentB === null) continue;
      const year = column.replace(" ($B)", "");
      data.push({ country, year, investmentB });
    }
  }

  res.json(data.map((d) => GetInvestmentByCountryResponseItem.parse(d)));
});

router.get("/investment/sentiment", (_req, res) => {
  const csvRows = loadCsvDataRows("6_public_sentiment_by_country.csv", 2);

  const data = csvRows
    .map((row) => {
      const country = row["Country"]?.trim();
      if (!country) return null;
      return {
        country,
        beneficialPct: toPercent(row["% See AI as Beneficial (2024)"]) ?? 0,
        changeJobPct: toPercent(row["% Believe AI Will Change Their Job (5yr)"]),
        fearReplacePct: toPercent(row["% Fear AI Will Replace Job (5yr)"]),
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  res.json(data.map((d) => GetSentimentByCountryResponseItem.parse(d)));
});

export default router;
