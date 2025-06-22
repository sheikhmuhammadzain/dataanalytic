"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"
import { useMemo } from "react"
import { useDataStore } from "../../store/dataStore"

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

export const description = "A dynamic area chart based on your CSV data"

export function ChartAreaDefault() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data from CSV
  const { chartData, chartConfig, xAxisKey, yAxisKey, noData } = useMemo(() => {
    if (!processedData?.rows || processedData.rows.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey: '',
        noData: true
      };
    }

    const { headers, summary } = processedData;
    
    // For area chart, we need at least one numerical column
    if (summary.numericalColumns.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey: '',
        noData: true
      };
    }

    // Use first categorical column as X-axis, or first column if no categorical
    let xKey = summary.categoricalColumns[0] || headers[0];
    // Use first numerical column as Y-axis
    let yKey = summary.numericalColumns[0];

    // If we have a date-like column, prefer it for X-axis
    const dateColumn = headers.find(header => 
      header.toLowerCase().includes('date') || 
      header.toLowerCase().includes('time') ||
      header.toLowerCase().includes('month') ||
      header.toLowerCase().includes('year')
    );
    if (dateColumn) {
      xKey = dateColumn;
    }

    // Prepare chart data - limit to first 20 rows for better visualization
    const data = processedData.rows.slice(0, 20).map(row => ({
      [xKey]: String(row[xKey] || ''),
      [yKey]: Number(row[yKey]) || 0,
    }));

    const config = {
      [yKey]: {
        label: yKey,
        color: "hsl(220 70% 50%)",
      },
    } satisfies ChartConfig;

    return {
      chartData: data,
      chartConfig: config,
      xAxisKey: xKey,
      yAxisKey: yKey,
      noData: false
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Area Chart</CardTitle>
          <CardDescription>
            Upload CSV data to visualize trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>No data available. Please upload a CSV file.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'stable', percentage: 0 };
    
    const firstValue = chartData[0][yAxisKey];
    const lastValue = chartData[chartData.length - 1][yAxisKey];
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs(change).toFixed(1)
    };
  }, [chartData, yAxisKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart</CardTitle>
        <CardDescription>
          Showing {yAxisKey} trends across {xAxisKey}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => String(value).slice(0, 10)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey={yAxisKey}
                type="natural"
                fill="hsl(220 70% 50%)"
                fillOpacity={0.4}
                stroke="hsl(220 70% 50%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {trend.direction === 'up' && (
                <>Trending up by {trend.percentage}% <TrendingUp className="h-4 w-4" /></>
              )}
              {trend.direction === 'down' && (
                <>Trending down by {trend.percentage}% <TrendingUp className="h-4 w-4 rotate-180" /></>
              )}
              {trend.direction === 'stable' && (
                <>Stable trend <TrendingUp className="h-4 w-4" /></>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Based on your uploaded data
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
} 