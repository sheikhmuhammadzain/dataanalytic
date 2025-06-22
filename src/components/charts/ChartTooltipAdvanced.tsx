"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"
import { useMemo } from "react"
import { useDataStore } from "../../store/dataStore"
import { ChartExplanation } from "../ChartExplanation"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart"

export const description = "A stacked bar chart with advanced tooltip showing totals"

export function ChartTooltipAdvanced() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data from CSV
  const { chartData, chartConfig, xAxisKey, yAxisKey1, yAxisKey2, noData } = useMemo(() => {
    if (!processedData?.rows || processedData.rows.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey1: '',
        yAxisKey2: '',
        noData: true
      };
    }

    const { headers, summary } = processedData;
    
    // For stacked chart, we need at least two numerical columns and one categorical
    if (summary.numericalColumns.length < 2) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey1: '',
        yAxisKey2: '',
        noData: true
      };
    }

    // Use categorical column for X-axis, or first column if no categorical
    let xKey = summary.categoricalColumns[0] || headers[0];
    // Use different numerical columns for stacking
    let yKey1 = summary.numericalColumns[0];
    let yKey2 = summary.numericalColumns[1];

    // Prefer different columns than other charts for variety
    if (summary.numericalColumns.length >= 3) {
      yKey1 = summary.numericalColumns[0];
      yKey2 = summary.numericalColumns[2];
    }

    // If we have a date/time column, prefer it for X-axis
    const dateColumn = headers.find(header => 
      header.toLowerCase().includes('date') || 
      header.toLowerCase().includes('time') ||
      header.toLowerCase().includes('month') ||
      header.toLowerCase().includes('year')
    );
    if (dateColumn) {
      xKey = dateColumn;
    }

    // Prepare chart data - limit to first 8 rows for better stacked visualization
    // Group data to avoid too many bars
    const dataMap = new Map();
    processedData.rows.slice(0, 12).forEach(row => {
      const category = String(row[xKey] || 'Unknown');
      const value1 = Number(row[yKey1]) || 0;
      const value2 = Number(row[yKey2]) || 0;
      
      if (dataMap.has(category)) {
        const existing = dataMap.get(category);
        dataMap.set(category, {
          [yKey1]: existing[yKey1] + value1,
          [yKey2]: existing[yKey2] + value2
        });
      } else {
        dataMap.set(category, {
          [yKey1]: value1,
          [yKey2]: value2
        });
      }
    });

    // Convert map to array
    const data = Array.from(dataMap.entries())
      .map(([category, values]) => ({
        [xKey]: category,
        [yKey1]: values[yKey1],
        [yKey2]: values[yKey2],
        total: values[yKey1] + values[yKey2]
      }))
      .slice(0, 8); // Limit for better visualization

    const config = {
      [yKey1]: {
        label: yKey1,
        color: "hsl(160 60% 45%)",
      },
      [yKey2]: {
        label: yKey2,
        color: "hsl(220 70% 50%)",
      },
    } satisfies ChartConfig;

    return {
      chartData: data,
      chartConfig: config,
      xAxisKey: xKey,
      yAxisKey1: yKey1,
      yAxisKey2: yKey2,
      noData: false
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stacked Comparison Analysis</CardTitle>
          <CardDescription>
            Upload CSV data with multiple numerical columns to compare values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>No data available. Need at least 2 numerical columns.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend and insights
  const insights = useMemo(() => {
    if (chartData.length === 0) return { trend: 'stable', balance: 'balanced', totalSum: 0 };
    
    const totals = chartData.map(item => item.total);
    const sum1 = chartData.reduce((sum, item) => sum + item[yAxisKey1], 0);
    const sum2 = chartData.reduce((sum, item) => sum + item[yAxisKey2], 0);
    const totalSum = sum1 + sum2;
    
    const avgTotal = totals.reduce((sum, val) => sum + val, 0) / totals.length;
    const maxTotal = Math.max(...totals);
    
    return {
      trend: maxTotal > avgTotal * 1.5 ? 'peaked' : 'consistent',
      balance: Math.abs(sum1 - sum2) / totalSum < 0.2 ? 'balanced' : sum1 > sum2 ? `${yAxisKey1}_dominant` : `${yAxisKey2}_dominant`,
      totalSum,
      ratio: `${Math.round((sum1/totalSum)*100)}:${Math.round((sum2/totalSum)*100)}`
    };
  }, [chartData, yAxisKey1, yAxisKey2]);

  return (
    <Card className="relative">
      <ChartExplanation
        chartType="Stacked Bar Chart"
        dataKeys={{ xAxisKey, yAxisKey1, yAxisKey2 }}
        chartData={chartData}
        insights={insights}
      />
      <CardHeader>
        <CardTitle>Stacked Comparison of {yAxisKey1.replace(/_/g, ' ')} vs {yAxisKey2.replace(/_/g, ' ')}</CardTitle>
        <CardDescription>
          Stacked comparison of {yAxisKey1.replace(/_/g, ' ').toLowerCase()} vs {yAxisKey2.replace(/_/g, ' ').toLowerCase()} with totals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => String(value).slice(0, 8)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent 
                    hideLabel
                    className="w-40"
                    formatter={(value, name, item) => (
                      <>
                        <div className="h-2 w-2 shrink-0 rounded-[2px] bg-[--color-bg]" 
                             style={
                               {
                                 "--color-bg": `var(--color-${name})`,
                               } as React.CSSProperties
                             } />
                        {chartConfig[name as keyof typeof chartConfig]?.label || name}
                        <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                          {value}
                        </div>
                        {/* Add total row */}
                        {name === yAxisKey2 && (
                          <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                            Total
                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                              {item.payload.total}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  />
                }
              />
              <Bar dataKey={yAxisKey1} stackId="a" fill="hsl(160 60% 45%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey={yAxisKey2} stackId="a" fill="hsl(220 70% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {insights.balance === 'balanced' ? (
            <>Well balanced distribution ({insights.ratio}) <TrendingUp className="h-4 w-4" /></>
          ) : insights.balance.includes('dominant') ? (
            <>{insights.balance.replace('_dominant', '').replace(/_/g, ' ')} dominates ({insights.ratio}) <TrendingUp className="h-4 w-4" /></>
          ) : (
            <>Mixed distribution pattern <TrendingUp className="h-4 w-4" /></>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Total: {insights.totalSum} | {insights.trend === 'peaked' ? 'Peak values detected' : 'Consistent pattern'}
        </div>
      </CardFooter>
    </Card>
  )
} 