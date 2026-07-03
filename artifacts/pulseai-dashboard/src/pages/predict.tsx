import React, { useState } from "react";
import { 
  useGetIndustryAdoption,
  useGetForecast,
  getGetForecastQueryKey
} from "@workspace/api-client-react";
import { ExportButtons } from "@/components/export-buttons";
import { getIndustryColor } from "@/lib/colors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ReferenceLine,
  Label
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingUp, Info } from "lucide-react";

export function Predict() {
  const { data: adoption, isLoading: loadingIndustries } = useGetIndustryAdoption();
  
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [yearsAhead, setYearsAhead] = useState<number>(3);

  // Initialize with first industry
  React.useEffect(() => {
    if (adoption?.industries?.length && !selectedIndustry) {
      setSelectedIndustry(adoption.industries[0]);
    }
  }, [adoption, selectedIndustry]);

  const { data: forecast, isLoading: loadingForecast, error } = useGetForecast(
    { industry: selectedIndustry, yearsAhead },
    {
      query: {
        enabled: !!selectedIndustry,
        queryKey: getGetForecastQueryKey({ industry: selectedIndustry, yearsAhead })
      }
    }
  );

  const chartData = React.useMemo(() => {
    if (!forecast) return [];
    
    // Combine historical and projected
    const combined = [
      ...forecast.historical.map(h => ({ year: String(h.year), historical: h.adoptionRate, projected: null })),
      // overlap the last historical point with projected line so it connects visually
      ...forecast.projected.map((p, i) => {
        if (i === 0) return { year: String(p.year), historical: null, projected: p.adoptionRate, isProjected: true };
        return { year: String(p.year), historical: null, projected: p.adoptionRate, isProjected: true };
      })
    ];

    // Ensure the connection point
    if (forecast.historical.length > 0 && forecast.projected.length > 0) {
      const lastHist = forecast.historical[forecast.historical.length - 1];
      const match = combined.find(c => c.year === String(lastHist.year));
      if (match) {
        match.projected = lastHist.adoptionRate;
      }
    }

    return combined;
  }, [forecast]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Adoption Forecast</h1>
        <p className="text-muted-foreground mt-1">Predictive modeling of AI integration timelines to mainstream adoption (50%).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-6 lg:col-span-1 print-hide">
          <Card>
            <CardHeader>
              <CardTitle>Forecast Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Industry Sector</Label>
                {loadingIndustries ? (
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

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Projection Horizon</Label>
                  <span className="text-sm font-medium text-muted-foreground">{yearsAhead} years</span>
                </div>
                <Slider 
                  value={[yearsAhead]} 
                  min={1} 
                  max={5} 
                  step={1} 
                  onValueChange={(v) => setYearsAhead(v[0])} 
                />
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
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Gap to Mainstream (50%)</div>
                    {forecast.gapTo50 <= 0 ? (
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">Already Achieved</div>
                    ) : (
                      <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">{forecast.gapTo50.toFixed(1)}% remaining</div>
                    )}
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

        <div className="lg:col-span-3">
          <Card className="shadcn-card h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Linear Regression Projection</CardTitle>
                <CardDescription>Historical data vs projected trend for {selectedIndustry}</CardDescription>
              </div>
              <ExportButtons data={chartData} filename={`forecast_${selectedIndustry}`} />
            </CardHeader>
            <CardContent>
              <div className="h-[450px]">
                {loadingForecast ? (
                  <Skeleton className="w-full h-full" />
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Adoption Rate']}
                      />
                      <Legend />
                      <ReferenceLine y={50} label={{ position: 'top', value: 'Mainstream Adoption (50%)', fill: 'var(--muted-foreground)', fontSize: 12 }} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                      
                      <Line 
                        type="monotone" 
                        dataKey="historical" 
                        name="Historical Data" 
                        stroke={selectedIndustry ? getIndustryColor(selectedIndustry) : "var(--primary)"} 
                        strokeWidth={3} 
                        dot={{ r: 4 }} 
                        activeDot={{ r: 6 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="projected" 
                        name="Forecast" 
                        stroke={selectedIndustry ? getIndustryColor(selectedIndustry) : "var(--primary)"} 
                        strokeWidth={3} 
                        strokeDasharray="5 5" 
                        dot={{ r: 4 }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
