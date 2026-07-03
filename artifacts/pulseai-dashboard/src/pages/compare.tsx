import React, { useState } from "react";
import { 
  useGetIndustryAdoption,
} from "@workspace/api-client-react";
import { ExportButtons } from "@/components/export-buttons";
import { getIndustryColor } from "@/lib/colors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  // Initialize with top 2 industries if available and none selected
  React.useEffect(() => {
    if (adoption?.industries && selectedIndustries.length === 0) {
      setSelectedIndustries(adoption.industries.slice(0, 2));
    }
  }, [adoption, selectedIndustries.length]);

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry) 
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  const chartData = React.useMemo(() => {
    if (!adoption?.rows) return [];
    const years = Array.from(new Set(adoption.rows.map(r => r.year)));
    return years.map(year => {
      const point: any = { year };
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
      const yoy = latest - previous;
      return {
        industry: ind,
        latest,
        previous,
        yoy,
        summary: adoption.summaries?.[ind] || ""
      };
    }).sort((a, b) => b.latest - a.latest);
  }, [adoption, selectedIndustries]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Industry Comparison</h1>
        <p className="text-muted-foreground mt-1">Benchmark AI adoption trajectories across sectors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1 print-hide">
          <CardHeader>
            <CardTitle>Sectors</CardTitle>
            <CardDescription>Select industries to compare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
            ) : (
              adoption?.industries.map(ind => (
                <div key={ind} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`ind-${ind}`} 
                    checked={selectedIndustries.includes(ind)}
                    onCheckedChange={() => toggleIndustry(ind)}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getIndustryColor(ind) }} />
                    <Label htmlFor={`ind-${ind}`} className="cursor-pointer flex-1 leading-tight">{ind}</Label>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="col-span-1 md:col-span-3 space-y-6">
          <Card className="shadcn-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Adoption Trajectory Overlay</CardTitle>
                <CardDescription>Year over year progression for selected sectors</CardDescription>
              </div>
              <ExportButtons data={chartData} filename="industry_comparison" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : chartData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">Select industries to compare</div>
              ) : simpleView ? (
                <ul className="space-y-2.5">
                  {tableData.map((row) => (
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
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                      <XAxis dataKey="year" stroke={AXIS_STROKE} fontSize={12} tickLine={false} />
                      <YAxis stroke={AXIS_STROKE} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
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
                  <strong>Takeaway:</strong> {tableData[0].industry} leads the selected sectors at {tableData[0].latest}% adoption.
                </div>
              )}
            </CardContent>
          </Card>

          {tableData.length > 0 && (
            <Card className="shadcn-card">
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Industry</TableHead>
                        <TableHead className="text-right">Latest Adoption</TableHead>
                        <TableHead className="text-right">YoY Growth</TableHead>
                        <TableHead>Key Insight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((row) => (
                        <TableRow key={row.industry}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getIndustryColor(row.industry) }} />
                            {row.industry}
                          </TableCell>
                          <TableCell className="text-right font-bold">{row.latest}%</TableCell>
                          <TableCell className="text-right">
                            <span className={row.yoy > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                              {row.yoy > 0 ? "+" : ""}{row.yoy.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate" title={row.summary}>
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
    </div>
  );
}
