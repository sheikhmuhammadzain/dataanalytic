"use client"

import { Bar, BarChart, XAxis, ResponsiveContainer } from "recharts"
import { useMemo } from "react"
import { useDataStore } from "../../store/dataStore"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart"

export const description = "A dynamic stacked bar chart with advanced tooltips based on your CSV data"

export function ChartTooltipAdvanced() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data from CSV
  const { chartData, chartConfig, xAxisKey, yAxisKey1, yAxisKey2, noData, insights } = useMemo(() => {
    if (!processedData?.rows || processedData.rows.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey1: '',
        yAxisKey2: '',
        noData: true,
        insights: { maxTotal: 0, avgTotal: 0, dataPoints: 0 }
      };
    }

    const { headers, summary } = processedData;
    
    // For stacked bar chart, we need at least 2 numerical columns
    if (summary.numericalColumns.length < 2) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey1: '',
        yAxisKey2: '',
        noData: true,
        insights: { maxTotal: 0, avgTotal: 0, dataPoints: 0 }
      };
    }

    // Use different columns for variety - try to use columns not heavily used by other charts
    let xKey = summary.categoricalColumns[0] || headers[0];
    let yKey1 = summary.numericalColumns[0];
    let yKey2 = summary.numericalColumns[1];

    // Prefer date columns for X-axis for stacked charts
    const dateColumn = headers.find(header => 
      header.toLowerCase().includes('date') || 
      header.toLowerCase().includes('time') ||
      header.toLowerCase().includes('day') ||
      header.toLowerCase().includes('week') ||
      header.toLowerCase().includes('period')
    );
    if (dateColumn) {
      xKey = dateColumn;
    }

    // Try to use different numerical columns than other charts
    if (summary.numericalColumns.length >= 4) {
      yKey1 = summary.numericalColumns[2]; // Different from area, line, pie
      yKey2 = summary.numericalColumns[3];
    } else if (summary.numericalColumns.length >= 3) {
      yKey1 = summary.numericalColumns[1];
      yKey2 = summary.numericalColumns[2];
    }

    // Prepare chart data - limit to 8 data points for better stacked visualization
    const data = processedData.rows.slice(0, 8).map(row => {
      const value1 = Number(row[yKey1]) || 0;
      const value2 = Number(row[yKey2]) || 0;
      return {
        [xKey]: String(row[xKey] || ''),
        [yKey1]: value1,
        [yKey2]: value2,
        total: value1 + value2
      };
    }).filter(item => item.total > 0); // Remove entries with no data

    // Calculate insights
    const totals = data.map(item => item.total);
    const maxTotal = Math.max(...totals);
    const avgTotal = totals.reduce((sum, val) => sum + val, 0) / totals.length;

    const config = {
      [yKey1]: {
        label: yKey1,
        color: "hsl(220 70% 50%)", // chart-1
      },
      [yKey2]: {
        label: yKey2,
        color: "hsl(160 60% 45%)", // chart-2
      },
    } satisfies ChartConfig;

    return {
      chartData: data,
      chartConfig: config,
      xAxisKey: xKey,
      yAxisKey1: yKey1,
      yAxisKey2: yKey2,
      noData: false,
      insights: {
        maxTotal: Math.round(maxTotal),
        avgTotal: Math.round(avgTotal),
        dataPoints: data.length
      }
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tooltip - Advanced</CardTitle>
          <CardDescription>
            Upload CSV data with multiple numerical columns to see stacked comparisons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>No data available. Please upload a CSV file with at least 2 numerical columns.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tooltip - Advanced</CardTitle>
        <CardDescription>
          Stacked comparison of {yAxisKey1} vs {yAxisKey2} with totals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart accessibilityLayer data={chartData}>
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => {
                  // Try to format as date if it looks like a date
                  const dateValue = new Date(value);
                  if (!isNaN(dateValue.getTime()) && value.includes('-')) {
                    return dateValue.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric"
                    });
                  }
                  // Otherwise, truncate string
                  return String(value).slice(0, 8);
                }}
              />
              <Bar
                dataKey={yAxisKey1}
                stackId="a"
                fill="hsl(220 70% 50%)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey={yAxisKey2}
                stackId="a"
                fill="hsl(160 60% 45%)"
                radius={[4, 4, 0, 0]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    className="w-[200px]"
                    formatter={(value, name, item, index) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={
                            {
                              backgroundColor: name === yAxisKey1 ? "hsl(220 70% 50%)" : "hsl(160 60% 45%)",
                            } as React.CSSProperties
                          }
                        />
                        {chartConfig[name as keyof typeof chartConfig]?.label || name}
                        <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                          {value}
                        </div>
                        {/* Add total after the last item */}
                        {index === 1 && (
                          <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                            Total
                            <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                              {item.payload[yAxisKey1] + item.payload[yAxisKey2]}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  />
                }
                cursor={false}
                defaultIndex={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 