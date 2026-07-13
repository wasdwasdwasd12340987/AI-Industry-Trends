import React, { useState } from "react";
import {
  useGetIndustryAdoption,
  useGetForecast,
  useGetForecastAll,
  getGetForecastQueryKey,
} from "@workspace/api-client-react";
import { ExportButtons } from "@/components/export-buttons";
import { getIndustryColor } from "@/lib/colors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { TrendingUp, ChevronDown } from "lucide-react";
import { useSimpleView } from "@/components/layout";

const AXIS_STROKE = "var(--color-muted-foreground)";
const GRID_STROKE = "var(--color-border)";
const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-popover)",
  borderColor: "var(--color-border)",
  color: "var(--color-popover-foreground)",
};

export function Compare() {
  const { simpleView } = useSimpleView();
  const { data: adoption, isLoading } = useGetIndustryAdoption();

  // --- Compare state ---
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  React.useEffect(() => {
    if (adoption?.industries && selectedIndustries.length === 0) {
      setSelectedIndustries(adoption.industries.slice(0, 2));
    }
  }, [adoption, selectedIndustries.length]);

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  const compareChartData = React.useMemo(() => {
    if (!adoption?.rows) return [];
    const years = Array.from(new Set(adoption.rows.map(r => r.year)));
    return years.map(year => {
      const point: Record<string, unknown> = { year };
      selectedIndustries.forEach(ind => {
        const match = adoption.rows.find(r => r.year === year && r.industry === ind);
        point[ind] = match ? match.adoptionRate : null;
      });
      return point;
    });
  }, [adoption, selectedIndustries]);

  const tableData = React.useMemo(() => {
    if (!adoption?.rows) return [];
    return selectedIndustries.map(ind => {
      const indRows = adoption.rows.filter(r => r.industry === ind);
      const latest = indRows[indRows.length - 1]?.adoptionRate || 0;
      const previous = indRows[indRows.length - 2]?.adoptionRate || 0;
      return {
        industry: ind,
        latest,
        yoy: latest - previous,
        summary: adoption.summaries?.[ind] || "",
      };
    }).sort((a, b) => b.latest - a.latest);
  }, [adoption, selectedIndustries]);

  // --- Forecast state ---
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [yearsAhead, setYearsAhead] = useState<number>(3);
  const [forecastModel, setForecastModel] = useState<"linear" | "random-forest">("linear");

  React.useEffect(() => {
    if (adoption?.industries?.length && !selectedIndustry) {
      setSelectedIndustry(adoption.industries[0]!);
    }
  }, [adoption, selectedIndustry]);

  const { data: forecast, isLoading: loadingForecast, error } = useGetForecast(
    { industry: selectedIndustry, yearsAhead, model: forecastModel },
    { query: { enabled: !!selectedIndustry, queryKey: getGetForecastQueryKey({ industry: selectedIndustry, yearsAhead, model: forecastModel }) } }
  );

  const forecastChartData = React.useMemo(() => {
    if (!forecast) return [];
    const combined = [
      ...forecast.historical.map(h => ({ year: String(h.year), historical: h.adoptionRate, projected: null as number | null })),
      ...forecast.projected.map(p => ({ year: String(p.year), historical: null as number | null, projected: p.adoptionRate })),
    ];
    if (forecast.historical.length > 0 && forecast.projected.length > 0) {
      const lastHist = forecast.historical[forecast.historical.length - 1]!;
      const match = combined.find(c => c.year === String(lastHist.year));
      if (match) match.projected = lastHist.adoptionRate;
    }
    return combined;
  }, [forecast]);

  const rawProjectedValue = React.useMemo(
    () => (forecast ? forecast.slope * forecast.projectedYear + forecast.intercept : null),
    [forecast],
  );
  const isCapped = rawProjectedValue != null && (rawProjectedValue > 100 || rawProjectedValue < 0);

  const { data: forecastAll, isLoading: loadingForecastAll } = useGetForecastAll({ yearsAhead, model: forecastModel });
  const sortedForecastAll = React.useMemo(
    () => (forecastAll ? [...forecastAll].sort((a, b) => b.projectedValue - a.projectedValue) : []),
    [forecastAll],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compare & Forecast</h1>
        <p className="text-muted-foreground mt-1">Benchmark sectors side-by-side and model adoption trajectories.</p>
      </div>

      <Tabs defaultValue="compare">
        <TabsList className="mb-6">
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        {/* ── COMPARE TAB ── */}
        <TabsContent value="compare" className="m-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="col-span-1 print-hide">
              <CardHeader>
                <CardTitle>Sectors</CardTitle>
                <CardDescription>Select industries to compare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedIndustries.length === 0
                          ? "Select sectors…"
                          : `${selectedIndustries.length} sector${selectedIndustries.length > 1 ? "s" : ""} selected`}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto" align="start">
                      <DropdownMenuLabel>Industries</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {adoption?.industries.map(ind => (
                        <DropdownMenuCheckboxItem
                          key={ind}
                          checked={selectedIndustries.includes(ind)}
                          onCheckedChange={() => toggleIndustry(ind)}
                          onSelect={e => e.preventDefault()}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getIndustryColor(ind) }} />
                            {ind}
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {selectedIndustries.map(ind => (
                    <span key={ind} className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getIndustryColor(ind) }} />
                      {ind}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="col-span-1 md:col-span-3 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Adoption Trajectory Overlay</CardTitle>
                    <CardDescription>Year over year progression for selected sectors</CardDescription>
                  </div>
                  <ExportButtons data={compareChartData} filename="industry_comparison" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="w-full h-[380px]" />
                  ) : compareChartData.length === 0 ? (
                    <div className="h-[380px] flex items-center justify-center text-muted-foreground">
                      Select industries to compare
                    </div>
                  ) : simpleView ? (
                    <ul className="space-y-2.5">
                      {tableData.map(row => (
                        <li key={row.industry} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getIndustryColor(row.industry) }} />
                            {row.industry}
                          </span>
                          <span className="font-semibold">{row.latest}% ({row.yoy > 0 ? "+" : ""}{row.yoy.toFixed(1)}pt YoY)</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="h-[380px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={compareChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                          <XAxis dataKey="year" stroke={AXIS_STROKE} fontSize={12} tickLine={false} />
                          <YAxis stroke={AXIS_STROKE} fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                          <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                          <Legend />
                          {selectedIndustries.map(ind => (
                            <Line key={ind} type="monotone" dataKey={ind} stroke={getIndustryColor(ind)} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {tableData.length > 0 && (
                    <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      <strong>Takeaway:</strong> {tableData[0]!.industry} leads the selected sectors at {tableData[0]!.latest}% adoption.
                    </div>
                  )}
                </CardContent>
              </Card>

              {tableData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Industry</TableHead>
                            <TableHead className="text-right">Latest</TableHead>
                            <TableHead className="text-right">YoY</TableHead>
                            <TableHead>Key Insight</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.map(row => (
                            <TableRow key={row.industry}>
                              <TableCell className="font-medium">
                                <span className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getIndustryColor(row.industry) }} />
                                  {row.industry}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-bold">{row.latest}%</TableCell>
                              <TableCell className="text-right">
                                <span className={row.yoy > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                  {row.yoy > 0 ? "+" : ""}{row.yoy.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[280px] whitespace-normal break-words">
                                {row.summary}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── FORECAST TAB ── */}
        <TabsContent value="forecast" className="m-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="space-y-6 lg:col-span-1 print-hide">
              <Card>
                <CardHeader>
                  <CardTitle>Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Industry Sector</Label>
                    {isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {adoption?.industries.map(ind => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Forecasting Model</Label>
                    <Select value={forecastModel} onValueChange={(v) => setForecastModel(v as "linear" | "random-forest")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear Regression</SelectItem>
                        <SelectItem value="random-forest">Random Forest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>Projection Horizon</Label>
                      <span className="text-sm font-medium text-muted-foreground">{yearsAhead} years</span>
                    </div>
                    <Slider value={[yearsAhead]} min={1} max={5} step={1} onValueChange={v => setYearsAhead(v[0]!)} />
                  </div>
                </CardContent>
              </Card>

              {forecast && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <TrendingUp className="h-5 w-5" />
                      <h3>Forecast Summary</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Target Year ({forecast.projectedYear})</div>
                        <div className="text-2xl font-bold">{forecast.projectedValue.toFixed(1)}%</div>
                        {isCapped && rawProjectedValue != null && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Capped at {rawProjectedValue > 100 ? "100%" : "0%"} — raw trend: {rawProjectedValue.toFixed(1)}%.
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Gap to Mainstream (50%)</div>
                        {forecast.gapTo50 <= 0 ? (
                          <div className="text-lg font-semibold text-green-600 dark:text-green-400">Already Achieved</div>
                        ) : (
                          <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">{forecast.gapTo50.toFixed(1)}% remaining</div>
                        )}
                      </div>
                      <div className="border-t border-border/50 pt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">R²</div>
                          <div className="font-semibold">{forecast.r2.toFixed(3)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">MAE</div>
                          <div className="font-semibold">{forecast.mae.toFixed(2)}pp</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error.data?.error || "Failed to generate forecast"}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Linear Regression Projection</CardTitle>
                    <CardDescription>Historical data vs projected trend for {selectedIndustry}</CardDescription>
                  </div>
                  <ExportButtons data={forecastChartData} filename={`forecast_${selectedIndustry}`} />
                </CardHeader>
                <CardContent>
                  {loadingForecast ? (
                    <Skeleton className="w-full h-[380px]" />
                  ) : forecastChartData.length === 0 ? null : simpleView ? (
                    <ul className="space-y-2.5 h-[380px] overflow-y-auto pr-1">
                      {forecastChartData.map(row => (
                        <li key={row.year} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                          <span className="font-medium">{row.year}</span>
                          <span className="text-muted-foreground">
                            {row.historical != null
                              ? <>Historical: <span className="text-foreground font-semibold">{row.historical.toFixed(1)}%</span></>
                              : <>Projected: <span className="text-foreground font-semibold">{row.projected?.toFixed(1)}%</span></>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="h-[380px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={forecastChartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                          <XAxis dataKey="year" stroke={AXIS_STROKE} fontSize={12} tickLine={false} />
                          <YAxis stroke={AXIS_STROKE} fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                          <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(1)}%`, "Adoption Rate"]} />
                          <Legend />
                          <ReferenceLine y={50} stroke={AXIS_STROKE} strokeDasharray="3 3"
                            label={{ position: "top", value: "Mainstream (50%)", fill: AXIS_STROKE, fontSize: 11 }} />
                          <Line type="monotone" dataKey="historical" name="Historical" stroke={selectedIndustry ? getIndustryColor(selectedIndustry) : "var(--color-primary)"} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="projected" name="Forecast" stroke={selectedIndustry ? getIndustryColor(selectedIndustry) : "var(--color-primary)"} strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {forecast && (
                    <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      <strong>Takeaway:</strong> {selectedIndustry} projected to reach {forecast.projectedValue.toFixed(1)}% by {forecast.projectedYear}
                      {forecast.gapTo50 <= 0 ? " — already past mainstream." : `, ${forecast.gapTo50.toFixed(1)}pp short of mainstream.`}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2025 + {yearsAhead}yr Outlook — All Industries</CardTitle>
                  <CardDescription>Projected adoption by {2025 + yearsAhead} across every tracked sector</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingForecastAll ? (
                    <Skeleton className="w-full h-32" />
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Industry</TableHead>
                            <TableHead className="text-right">Projected {2025 + yearsAhead}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedForecastAll.map(row => (
                            <TableRow key={row.industry} className={row.industry === selectedIndustry ? "bg-muted/40" : ""}>
                              <TableCell>
                                <span className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getIndustryColor(row.industry) }} />
                                  {row.industry}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-semibold">{row.projectedValue.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
