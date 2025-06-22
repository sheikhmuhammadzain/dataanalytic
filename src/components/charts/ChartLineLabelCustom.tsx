"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, LabelList, Line, LineChart, XAxis, ResponsiveContainer } from "recharts"
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

export const description = "A dynamic line chart with custom labels based on your CSV data"

export function ChartLineLabelCustom() {
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
    
    // For line chart, we need at least one numerical column
    if (summary.numericalColumns.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey: '',
        noData: true
      };
    }

    // Use second categorical column if available, otherwise first, or first column if no categorical
    let xKey = summary.categoricalColumns[1] || summary.categoricalColumns[0] || headers[0];
    // Use second numerical column if available, otherwise first
    let yKey = summary.numericalColumns[1] || summary.numericalColumns[0];

    // If we have a date/time column, prefer it for X-axis
    const dateColumn = headers.find(header => 
      header.toLowerCase().includes('date') || 
      header.toLowerCase().includes('time') ||
      header.toLowerCase().includes('month') ||
      header.toLowerCase().includes('year') ||
      header.toLowerCase().includes('quarter')
    );
    if (dateColumn) {
      xKey = dateColumn;
    }

    // If we have different columns than area chart, try to use them
    const areaChartX = summary.categoricalColumns[0] || headers[0];
    const areaChartY = summary.numericalColumns[0];
    
    // Try to use different columns for variety
    if (xKey === areaChartX && summary.categoricalColumns.length > 1) {
      xKey = summary.categoricalColumns[1];
    }
    if (yKey === areaChartY && summary.numericalColumns.length > 1) {
      yKey = summary.numericalColumns[1];
    }

    // Prepare chart data - limit to first 12 rows for better line visualization
    const data = processedData.rows.slice(0, 12).map(row => ({
      [xKey]: String(row[xKey] || ''),
      [yKey]: Number(row[yKey]) || 0,
    })).filter(item => item[yKey] > 0); // Remove zero values for cleaner line

    const config = {
      [yKey]: {
        label: yKey,
        color: "hsl(30 80% 55%)",
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
          <CardTitle>Progression Analysis</CardTitle>
          <CardDescription>
            Upload CSV data to visualize trends and patterns
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

  // Calculate trend based on first vs last values
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'stable', percentage: 0 };
    
    const firstValue = chartData[0][yAxisKey];
    const lastValue = chartData[chartData.length - 1][yAxisKey];
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    return {
      direction: change > 10 ? 'up' : change < -10 ? 'down' : 'stable',
      percentage: Math.abs(change).toFixed(1),
      range: `${Math.min(...chartData.map(d => d[yAxisKey]))} - ${Math.max(...chartData.map(d => d[yAxisKey]))}`
    };
  }, [chartData, yAxisKey]);

  return (
    <Card className="relative">
      <ChartExplanation
        chartType="Line Chart"
        dataKeys={{ xAxisKey, yAxisKey }}
        chartData={chartData}
        insights={{ trend }}
      />
      <CardHeader>
        <CardTitle>{yAxisKey.replace(/_/g, ' ')} Progression Across {xAxisKey.replace(/_/g, ' ')}</CardTitle>
        <CardDescription>
          {yAxisKey.replace(/_/g, ' ').toLowerCase()} progression across {xAxisKey.replace(/_/g, ' ').toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 24,
                left: 24,
                right: 24,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => String(value).slice(0, 8)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    nameKey={yAxisKey}
                    hideLabel
                  />
                }
              />
              <Line
                dataKey={yAxisKey}
                type="natural"
                stroke="hsl(30 80% 55%)"
                strokeWidth={2}
                dot={{
                  fill: "hsl(30 80% 55%)",
                  r: 4
                }}
                activeDot={{
                  r: 6,
                }}
              >
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={10}
                  dataKey={xAxisKey}
                  formatter={(value: string) => String(value).slice(0, 6)}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {trend.direction === 'up' && (
            <>Trending up by {trend.percentage}% <TrendingUp className="h-4 w-4" /></>
          )}
          {trend.direction === 'down' && (
            <>Trending down by {trend.percentage}% <TrendingUp className="h-4 w-4" /></>
          )}
          {trend.direction === 'stable' && (
            <>Fairly stable trend <TrendingUp className="h-4 w-4" /></>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Range: {trend.range} | Based on your data
        </div>
      </CardFooter>
    </Card>
  )
} 