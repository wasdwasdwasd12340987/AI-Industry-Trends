import React, { useState, useMemo } from "react";
import {
  useGetDashboardSummary,
  useGetIndustryAdoption,
  useGetGlobalAdoptionTrend,
  useGetInvestmentByCountry,
  useGetSentimentByCountry,
  useGetToolUserGrowth,
  useGetBusinessFunctionAdoption
} from "@workspace/api-client-react";
import { ExportButtons } from "@/components/export-buttons";
import { getIndustryColor } from "@/lib/colors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useSimpleView } from "@/components/layout";

const AXIS_STROKE = "var(--color-muted-foreground)";
const GRID_STROKE = "var(--color-border)";
const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-popover)",
  borderColor: "var(--color-border)",
  color: "var(--color-popover-foreground)",
};
const CURSOR_FILL = { fill: "var(--color-muted)", opacity: 0.4 };

const HEADLINE_COUNT = 4;

function categorizeKpi(metric: string): string {
  const m = metric.toLowerCase();
  if (/invest|funding|capital|spend/.test(m)) return "Investment & Spend";
  if (/chatgpt|copilot|gemini|tool|model|platform/.test(m)) return "Tools & Platforms";
  if (/job|worker|employee|customer|teacher|productivity|hire|workforce/.test(m)) return "Workforce Impact";
  return "Adoption & Sentiment";
}

export function Home() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: adoption, isLoading: loadingAdoption } = useGetIndustryAdoption();
  const { data: trend, isLoading: loadingTrend } = useGetGlobalAdoptionTrend();

  const { data: investment, isLoading: loadingInv } = useGetInvestmentByCountry();
  const { data: sentiment, isLoading: loadingSent } = useGetSentimentByCountry();
  const { data: tools, isLoading: loadingTools } = useGetToolUserGrowth();
  const { data: functions, isLoading: loadingFunc } = useGetBusinessFunctionAdoption();

  const [geoView, setGeoView] = useState<"investment" | "sentiment">("investment");
  const [showAllIndustries, setShowAllIndustries] = useState(false);
  const [moreKpisOpen, setMoreKpisOpen] = useState(false);
  const { simpleView } = useSimpleView();

  const headlineKpis = summary?.kpis.slice(0, HEADLINE_COUNT) ?? [];
  const otherKpis = summary?.kpis.slice(HEADLINE_COUNT) ?? [];

  const groupedKpis = useMemo(() => {
    const groups = new Map<string, typeof otherKpis>();
    for (const kpi of otherKpis) {
      const category = categorizeKpi(kpi.metric);
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category)!.push(kpi);
    }
    return Array.from(groups.entries());
  }, [otherKpis]);

  const industryChartData = useMemo(
    () => formatIndustryData(adoption?.rows || [], adoption?.industries || []),
    [adoption]
  );

  const { highlighted, dimmed } = useMemo(() => {
    if (!adoption?.industries || !adoption.rows.length) return { highlighted: [], dimmed: [] };
    const latestByIndustry = adoption.industries.map(ind => {
      const rowsForInd = adoption.rows.filter(r => r.industry === ind);
      const latest = rowsForInd[rowsForInd.length - 1];
      return { industry: ind, latest: latest?.adoptionRate ?? 0 };
    });
    const sorted = [...latestByIndustry].sort((a, b) => b.latest - a.latest);
    const top3 = sorted.slice(0, 3).map(r => r.industry);
    const bottom3 = sorted.slice(-3).map(r => r.industry);
    const highlightSet = new Set([...top3, ...bottom3]);
    return {
      highlighted: adoption.industries.filter(i => highlightSet.has(i)),
      dimmed: adoption.industries.filter(i => !highlightSet.has(i)),
    };
  }, [adoption]);

  const topIndustry = useMemo(() => {
    if (!highlighted.length || !adoption) return null;
    const rowsForInd = adoption.rows.filter(r => r.industry === highlighted[0]);
    return { name: highlighted[0], value: rowsForInd[rowsForInd.length - 1]?.adoptionRate ?? 0 };
  }, [highlighted, adoption]);

  const bottomIndustry = useMemo(() => {
    if (!highlighted.length || !adoption) return null;
    const lowest = highlighted[highlighted.length - 1];
    const rowsForInd = adoption.rows.filter(r => r.industry === lowest);
    return { name: lowest, value: rowsForInd[rowsForInd.length - 1]?.adoptionRate ?? 0 };
  }, [highlighted, adoption]);

  const topInvestmentCountries = useMemo(() => {
    if (!investment) return [];
    return investment.filter(i => i.year === "2024").sort((a, b) => b.investmentB - a.investmentB).slice(0, 8);
  }, [investment]);

  const topSentimentCountries = useMemo(() => {
    if (!sentiment) return [];
    return sentiment.sort((a, b) => b.beneficialPct - a.beneficialPct).slice(0, 8);
  }, [sentiment]);

  const topFunctions = useMemo(() => {
    if (!functions) return [];
    return functions.filter(f => f.year === "2025" || f.year === "Late 2024").sort((a, b) => b.adoptionRate - a.adoptionRate).slice(0, 6);
  }, [functions]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Industry Adoption Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time pulse on enterprise AI integration, investment, and sentiment.</p>
      </div>

      {/* Headline KPIs */}
      <section className="space-y-4">
        {loadingSummary ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
          </div>
        ) : summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {headlineKpis.map((kpi, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.metric}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.period} • {kpi.source}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {groupedKpis.length > 0 && (
              <Collapsible open={moreKpisOpen} onOpenChange={setMoreKpisOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ChevronDown className={`h-4 w-4 transition-transform ${moreKpisOpen ? "rotate-180" : ""}`} />
                    {moreKpisOpen ? "Hide" : "Show"} {otherKpis.length} more metrics
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Accordion type="multiple" defaultValue={groupedKpis.map(([category]) => category)}>
                        {groupedKpis.map(([category, kpis]) => (
                          <AccordionItem key={category} value={category}>
                            <AccordionTrigger>
                              <span className="flex items-center gap-2">
                                {category}
                                <Badge variant="secondary" className="font-normal">{kpis.length}</Badge>
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Metric</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Source</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {kpis.map((kpi, i) => (
                                    <TableRow key={i}>
                                      <TableCell className="font-medium">{kpi.metric}</TableCell>
                                      <TableCell className="text-right font-semibold">{kpi.value}</TableCell>
                                      <TableCell className="text-muted-foreground">{kpi.period}</TableCell>
                                      <TableCell className="text-muted-foreground">{kpi.source}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        ) : null}
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4 shadcn-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Adoption Rate by Industry</CardTitle>
              <CardDescription>Enterprise AI adoption over time</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!simpleView && adoption && adoption.industries.length > 6 && (
                <Button variant="outline" size="sm" onClick={() => setShowAllIndustries(v => !v)}>
                  {showAllIndustries ? "Highlight top/bottom 3" : `Show all ${adoption.industries.length}`}
                </Button>
              )}
              <ExportButtons data={adoption?.rows || []} filename="industry_adoption" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingAdoption ? (
              <Skeleton className="w-full h-[350px]" />
            ) : !adoption ? null : simpleView ? (
              <div className="h-[350px] overflow-y-auto pr-1">
                <ul className="space-y-2.5">
                  {[...adoption.industries]
                    .map(ind => {
                      const rows = adoption.rows.filter(r => r.industry === ind);
                      const latest = rows[rows.length - 1]?.adoptionRate ?? 0;
                      const first = rows[0]?.adoptionRate ?? 0;
                      return { ind, latest, delta: latest - first };
                    })
                    .sort((a, b) => b.latest - a.latest)
                    .map(({ ind, latest, delta }) => (
                      <li key={ind} className="flex items-center justify-between gap-3 text-sm border-b border-border pb-2 last:border-0">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getIndustryColor(ind) }} />
                          {ind}
                        </span>
                        <span className="flex items-center gap-2 font-medium">
                          {latest}%
                          <span className={`flex items-center text-xs ${delta >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(delta).toFixed(0)}pt
                          </span>
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={industryChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                    <XAxis dataKey="year" stroke={AXIS_STROKE} fontSize={12} tickLine={false} />
                    <YAxis stroke={AXIS_STROKE} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                    {(showAllIndustries ? adoption.industries : highlighted).map(ind => (
                      <Line key={ind} type="monotone" dataKey={ind} stroke={getIndustryColor(ind)} strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    ))}
                    {!showAllIndustries && dimmed.map(ind => (
                      <Line
                        key={ind}
                        type="monotone"
                        dataKey={ind}
                        stroke={getIndustryColor(ind)}
                        strokeOpacity={0.15}
                        strokeWidth={1}
                        dot={false}
                        legendType="none"
                        activeDot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {adoption && topIndustry && bottomIndustry && (
              <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <strong>Takeaway:</strong> {topIndustry.name} leads adoption at {topIndustry.value}%, while {bottomIndustry.name} trails at {bottomIndustry.value}%
                {!simpleView && !showAllIndustries ? " — the chart highlights the top and bottom 3 industries; toggle \"Show all\" for the full picture." : "."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 lg:col-span-3 shadcn-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Global Trend</CardTitle>
              <CardDescription>Organizations adopting AI</CardDescription>
            </div>
            <ExportButtons data={trend || []} filename="global_trend" />
          </CardHeader>
          <CardContent>
            {loadingTrend ? (
              <Skeleton className="w-full h-[350px]" />
            ) : !trend ? null : simpleView ? (
              <div className="h-[350px] overflow-y-auto pr-1">
                <ul className="space-y-2.5">
                  {trend.map((point) => (
                    <li key={point.year} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                      <span className="font-medium">{point.year}</span>
                      <span className="text-muted-foreground">
                        AI: <span className="text-foreground font-semibold">{point.aiAnyFunctionPct}%</span>
                        {"  ·  "}GenAI: <span className="text-foreground font-semibold">{point.genAiSpecificallyPct}%</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                    <XAxis dataKey="year" stroke={AXIS_STROKE} fontSize={12} tickLine={false} />
                    <YAxis stroke={AXIS_STROKE} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                    <Area type="monotone" dataKey="aiAnyFunctionPct" name="AI Adoption" stroke="var(--color-chart-1)" fillOpacity={1} fill="var(--color-chart-1)" opacity={0.2} />
                    <Area type="monotone" dataKey="genAiSpecificallyPct" name="GenAI Specifically" stroke="var(--color-chart-2)" fillOpacity={1} fill="var(--color-chart-2)" opacity={0.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {trend && trend.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <strong>Takeaway:</strong> Generative AI adoption jumped from {trend[0].genAiSpecificallyPct}% to {trend[trend.length - 1].genAiSpecificallyPct}% since {trend[0].year}, accelerating overall AI integration globally.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="shadcn-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Global Perspective</CardTitle>
              <CardDescription>Investment vs Sentiment</CardDescription>
            </div>
            <Tabs value={geoView} onValueChange={(v: any) => setGeoView(v)}>
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="investment">Investment</TabsTrigger>
                <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Tabs value={geoView} className="mt-4">
              <TabsContent value="investment" className="m-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium">Private AI Investment ($B, 2024)</span>
                  <ExportButtons data={investment || []} filename="investment_by_country" />
                </div>
                {loadingInv ? (
                  <Skeleton className="w-full h-[280px]" />
                ) : !investment ? null : simpleView ? (
                  <ul className="space-y-2.5 h-[280px] overflow-y-auto pr-1">
                    {topInvestmentCountries.map((row) => (
                      <li key={row.country} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                        <span>{row.country}</span>
                        <span className="font-semibold">${row.investmentB}B</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topInvestmentCountries}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                        <XAxis dataKey="country" stroke={AXIS_STROKE} fontSize={12} tickLine={false} />
                        <YAxis stroke={AXIS_STROKE} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}B`} />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={CURSOR_FILL} />
                        <Bar dataKey="investmentB" name="Investment" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {topInvestmentCountries.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <strong>Takeaway:</strong> {topInvestmentCountries[0].country} leads global private AI investment at ${topInvestmentCountries[0].investmentB}B in 2024.
                  </div>
                )}
              </TabsContent>
              <TabsContent value="sentiment" className="m-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium">Public Sentiment (%)</span>
                  <ExportButtons data={sentiment || []} filename="sentiment_by_country" />
                </div>
                {loadingSent ? (
                  <Skeleton className="w-full h-[280px]" />
                ) : !sentiment ? null : simpleView ? (
                  <ul className="space-y-2.5 h-[280px] overflow-y-auto pr-1">
                    {topSentimentCountries.map((row) => (
                      <li key={row.country} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                        <span>{row.country}</span>
                        <span className="font-semibold">{row.beneficialPct}% beneficial</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topSentimentCountries}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                        <XAxis dataKey="country" stroke={AXIS_STROKE} fontSize={12} tickLine={false} />
                        <YAxis stroke={AXIS_STROKE} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={CURSOR_FILL} />
                        <Legend />
                        <Bar dataKey="beneficialPct" name="Beneficial" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="fearReplacePct" name="Fear Job Loss" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {topSentimentCountries.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <strong>Takeaway:</strong> {topSentimentCountries[0].country} shows the strongest public confidence, with {topSentimentCountries[0].beneficialPct}% viewing AI as beneficial.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="shadcn-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Business Function & Tool Adoption</CardTitle>
              <CardDescription>AI adoption by function and tool growth</CardDescription>
            </div>
            <ExportButtons data={functions || []} filename="business_functions" />
          </CardHeader>
          <CardContent>
             <Tabs defaultValue="functions" className="mt-4">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="functions">Business Functions</TabsTrigger>
                <TabsTrigger value="tools">Tool Growth</TabsTrigger>
              </TabsList>

              <TabsContent value="functions" className="m-0">
                {loadingFunc ? (
                  <Skeleton className="w-full h-[280px]" />
                ) : !functions ? null : simpleView ? (
                  <ul className="space-y-2.5 h-[280px] overflow-y-auto pr-1">
                    {topFunctions.map((row) => (
                      <li key={row.function} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                        <span>{row.function}</span>
                        <span className="font-semibold">{row.adoptionRate}%</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topFunctions} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
                        <XAxis type="number" stroke={AXIS_STROKE} fontSize={12} tickLine={false} tickFormatter={(value) => `${value}%`} />
                        <YAxis dataKey="function" type="category" stroke={AXIS_STROKE} fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={CURSOR_FILL} />
                        <Bar dataKey="adoptionRate" name="Adoption Rate" fill="var(--color-chart-4)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {topFunctions.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <strong>Takeaway:</strong> {topFunctions[0].function} has the highest AI adoption among business functions, at {topFunctions[0].adoptionRate}%.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tools" className="m-0">
                {loadingTools ? (
                  <Skeleton className="w-full h-[280px]" />
                ) : !tools ? null : simpleView ? (
                  <ul className="space-y-2.5 h-[280px] overflow-y-auto pr-1">
                    {[...tools].sort((a, b) => b.value - a.value).map((row) => (
                      <li key={row.tool} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                        <span>{row.tool}</span>
                        <span className="font-semibold">{row.value}M users</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tools} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
                        <XAxis type="number" stroke={AXIS_STROKE} fontSize={12} tickLine={false} />
                        <YAxis dataKey="tool" type="category" stroke={AXIS_STROKE} fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={CURSOR_FILL} />
                        <Bar dataKey="value" name="Users (Millions)" fill="var(--color-chart-5)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {tools && tools.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <strong>Takeaway:</strong> {[...tools].sort((a, b) => b.value - a.value)[0].tool} leads AI tool adoption with {[...tools].sort((a, b) => b.value - a.value)[0].value}M active users.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {summary?.lastUpdated && (
         <div className="text-xs text-muted-foreground text-center print-hide pt-6 mt-4 border-t border-border">
            Last updated: {summary.lastUpdated} | Sources: {summary.sources.join(', ')}
         </div>
      )}
    </div>
  );
}

function formatIndustryData(rows: any[], industries: string[]) {
  if (!rows || !rows.length) return [];
  const years = Array.from(new Set(rows.map(r => r.year)));
  return years.map(year => {
    const point: any = { year };
    industries.forEach(ind => {
      const match = rows.find(r => r.year === year && r.industry === ind);
      point[ind] = match ? match.adoptionRate : null;
    });
    return point;
  });
}
