import React, { useState } from "react";
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
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Home() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: adoption, isLoading: loadingAdoption } = useGetIndustryAdoption();
  const { data: trend, isLoading: loadingTrend } = useGetGlobalAdoptionTrend();
  
  const { data: investment, isLoading: loadingInv } = useGetInvestmentByCountry();
  const { data: sentiment, isLoading: loadingSent } = useGetSentimentByCountry();
  const { data: tools, isLoading: loadingTools } = useGetToolUserGrowth();
  const { data: functions, isLoading: loadingFunc } = useGetBusinessFunctionAdoption();

  const [geoView, setGeoView] = useState<"investment" | "sentiment">("investment");

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Industry Adoption Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time pulse on enterprise AI integration, investment, and sentiment.</p>
      </div>

      {loadingSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summary.kpis.map((kpi, i) => (
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
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4 shadcn-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Adoption Rate by Industry</CardTitle>
              <CardDescription>Enterprise AI adoption over time</CardDescription>
            </div>
            <ExportButtons data={adoption?.rows || []} filename="industry_adoption" />
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {loadingAdoption ? (
                <Skeleton className="w-full h-full" />
              ) : adoption ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatIndustryData(adoption.rows, adoption.industries)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }} 
                    />
                    <Legend />
                    {adoption.industries.map(ind => (
                      <Line key={ind} type="monotone" dataKey={ind} stroke={getIndustryColor(ind)} strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </div>
            {adoption?.summaries && (
              <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <strong>Key Insight:</strong> High tech and financial services continue to lead early adoption, with healthcare accelerating rapidly.
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
            <div className="h-[350px]">
              {loadingTrend ? (
                <Skeleton className="w-full h-full" />
              ) : trend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }} 
                    />
                    <Legend />
                    <Area type="monotone" dataKey="aiAnyFunctionPct" name="AI Adoption" stroke="var(--color-chart-1)" fillOpacity={1} fill="var(--color-chart-1)" opacity={0.2} />
                    <Area type="monotone" dataKey="genAiSpecificallyPct" name="GenAI Specifically" stroke="var(--color-chart-2)" fillOpacity={1} fill="var(--color-chart-2)" opacity={0.5} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
            {trend && trend.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <strong>Key Insight:</strong> Generative AI adoption jumped significantly since 2023, accelerating overall AI integration globally.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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
                <div className="h-[280px]">
                  {loadingInv ? (
                    <Skeleton className="w-full h-full" />
                  ) : investment ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={investment.filter(i => i.year === "2024").sort((a,b) => b.investmentB - a.investmentB).slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="country" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}B`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }}
                          cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                        />
                        <Bar dataKey="investmentB" name="Investment" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
              </TabsContent>
              <TabsContent value="sentiment" className="m-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium">Public Sentiment (%)</span>
                  <ExportButtons data={sentiment || []} filename="sentiment_by_country" />
                </div>
                <div className="h-[280px]">
                  {loadingSent ? (
                    <Skeleton className="w-full h-full" />
                  ) : sentiment ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sentiment.sort((a,b) => b.beneficialPct - a.beneficialPct).slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="country" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }}
                          cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                        />
                        <Legend />
                        <Bar dataKey="beneficialPct" name="Beneficial" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="fearReplacePct" name="Fear Job Loss" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
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
              
              <TabsContent value="functions" className="m-0 h-[280px]">
                {loadingFunc ? (
                  <Skeleton className="w-full h-full" />
                ) : functions ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={functions.filter(f => f.year === "2025" || f.year === "Late 2024").sort((a,b) => b.adoptionRate - a.adoptionRate).slice(0, 6)} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} tickFormatter={(value) => `${value}%`} />
                      <YAxis dataKey="function" type="category" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }}
                        cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                      />
                      <Bar dataKey="adoptionRate" name="Adoption Rate" fill="var(--color-chart-4)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </TabsContent>
              
              <TabsContent value="tools" className="m-0 h-[280px]">
                 {loadingTools ? (
                  <Skeleton className="w-full h-full" />
                ) : tools ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tools} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                      <YAxis dataKey="tool" type="category" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }}
                        cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                      />
                      <Bar dataKey="value" name="Users (Millions)" fill="var(--color-chart-5)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {summary?.lastUpdated && (
         <div className="text-xs text-muted-foreground text-center print-hide pt-4 border-t border-border">
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
