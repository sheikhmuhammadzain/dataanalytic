"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
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

export const description = "A dynamic line chart showing trends over time or categories"

export function ChartLineLabelCustom() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data from CSV
  const { chartData, chartConfig, xAxisKey, yAxisKey, noData, isTimeSeries } = useMemo(() => {
    if (!processedData?.rows || processedData.rows.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey: '',
        noData: true,
        isTimeSeries: false
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
        noData: true,
        isTimeSeries: false
      };
    }

    // Smart column selection for line charts
    let xKey = summary.categoricalColumns[0] || headers[0];
    let yKey = summary.numericalColumns[0];
    let isTimeSeries = false;

    // PRIORITY 1: Look for time-based columns for X-axis
    const timeColumn = headers.find(header => 
      header.toLowerCase().includes('date') || 
      header.toLowerCase().includes('time') ||
      header.toLowerCase().includes('month') ||
      header.toLowerCase().includes('year') ||
      header.toLowerCase().includes('quarter') ||
      header.toLowerCase().includes('period')
    );
    if (timeColumn) {
      xKey = timeColumn;
      isTimeSeries = true;
    }

    // PRIORITY 2: Look for meaningful Y-axis (sales, revenue, quantity, etc.)
    const salesAmountColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('sales_amount') ||
      col.toLowerCase().includes('revenue')
    );
    
    const quantityColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('quantity_sold') ||
      col.toLowerCase().includes('quantity')
    );
    
    const targetColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('sales_target') ||
      col.toLowerCase().includes('target')
    );
    
    const stockColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('stock_level') ||
      col.toLowerCase().includes('stock')
    );

    // Prioritize business-critical metrics
    if (salesAmountColumn) {
      yKey = salesAmountColumn;
    } else if (quantityColumn) {
      yKey = quantityColumn;
    } else if (targetColumn) {
      yKey = targetColumn;
    } else if (stockColumn) {
      yKey = stockColumn;
    } else {
      // Fallback to any numerical column
      yKey = summary.numericalColumns[0];
    }

    // For X-axis, if no time column, use categorical data that makes sense for trends
    if (!timeColumn) {
      const segmentColumn = headers.find(header => 
        header.toLowerCase().includes('customer_segment')
      );
      const categoryColumn = headers.find(header => 
        header.toLowerCase().includes('product_category')
      );
      
      if (segmentColumn && summary.categoricalColumns.includes(segmentColumn)) {
        xKey = segmentColumn;
      } else if (categoryColumn && summary.categoricalColumns.includes(categoryColumn)) {
        xKey = categoryColumn;
      }
    }

    // Aggregate data by X-axis key for better visualization
    const dataMap = new Map();
    processedData.rows.forEach(row => {
      const xValue = String(row[xKey] || 'Unknown');
      const yValue = Number(row[yKey]) || 0;
      
      if (dataMap.has(xValue)) {
        // For time series, sum the values; for categories, take average
        const existing = dataMap.get(xValue);
        dataMap.set(xValue, {
          sum: existing.sum + yValue,
          count: existing.count + 1,
          value: isTimeSeries ? existing.sum + yValue : (existing.sum + yValue) / (existing.count + 1)
        });
      } else {
        dataMap.set(xValue, {
          sum: yValue,
          count: 1,
          value: yValue
        });
      }
    });

    // Convert to array and sort appropriately
    let data = Array.from(dataMap.entries()).map(([key, aggregated]) => ({
      [xKey]: key,
      [yKey]: Math.round(aggregated.value * 100) / 100, // Round to 2 decimal places
    }));

    // Sort data for better line visualization
    if (isTimeSeries) {
      // For time series, try to sort chronologically
      data = data.sort((a, b) => {
        const aVal = a[xKey];
        const bVal = b[xKey];
        
        // Try to parse as date first
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return aDate.getTime() - bDate.getTime();
        }
        
        // Fallback to string comparison
        return aVal.localeCompare(bVal);
      });
    } else {
      // For categories, sort by value descending
      data = data.sort((a, b) => b[yKey] - a[yKey]);
    }

    // Limit to reasonable number of points (12-15 for readability)
    data = data.slice(0, 15);

    const config = {
      [yKey]: {
        label: yKey.replace(/_/g, ' '),
        color: "hsl(30 80% 55%)",
      },
    } satisfies ChartConfig;

    return {
      chartData: data,
      chartConfig: config,
      xAxisKey: xKey,
      yAxisKey: yKey,
      noData: false,
      isTimeSeries
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
          <CardDescription>
            Upload CSV data to visualize trends and patterns over time
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
    if (chartData.length < 2) return { direction: 'stable', percentage: 0, range: '0' };
    
    const values = chartData.map(d => d[yAxisKey]);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    return {
      direction: change > 10 ? 'up' : change < -10 ? 'down' : 'stable',
      percentage: Math.abs(change).toFixed(1),
      range: `${minValue.toLocaleString()} - ${maxValue.toLocaleString()}`
    };
  }, [chartData, yAxisKey]);

  // Create better title based on data type
  const chartTitle = useMemo(() => {
    const yLabel = yAxisKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const xLabel = xAxisKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    if (isTimeSeries) {
      return `${yLabel} Trend Over Time`;
    } else {
      return `${yLabel} by ${xLabel}`;
    }
  }, [yAxisKey, xAxisKey, isTimeSeries]);

  return (
    <Card className="relative">
      <ChartExplanation
        chartType="Line Chart"
        dataKeys={{ xAxisKey, yAxisKey }}
        chartData={chartData}
        insights={{ trend, isTimeSeries }}
      />
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <CardDescription>
          {isTimeSeries 
            ? `${yAxisKey.replace(/_/g, ' ').toLowerCase()} progression over time periods`
            : `${yAxisKey.replace(/_/g, ' ').toLowerCase()} comparison across ${xAxisKey.replace(/_/g, ' ').toLowerCase()}`
          }
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
                bottom: 24
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-45}
                textAnchor="end"
                height={60}
                tickFormatter={(value) => String(value).slice(0, 10)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <ChartTooltip
                cursor={{ stroke: "hsl(30 80% 55%)", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    nameKey={yAxisKey}
                    labelKey={xAxisKey}
                  />
                }
              />
              <Line
                dataKey={yAxisKey}
                type="monotone"
                stroke="hsl(30 80% 55%)"
                strokeWidth={3}
                dot={{
                  fill: "hsl(30 80% 55%)",
                  r: 5,
                  strokeWidth: 2,
                  stroke: "#fff"
                }}
                activeDot={{
                  r: 7,
                  strokeWidth: 2,
                  stroke: "#fff"
                }}
              />
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
            <>Declining by {trend.percentage}% <TrendingUp className="h-4 w-4 rotate-180" /></>
          )}
          {trend.direction === 'stable' && (
            <>Relatively stable trend <TrendingUp className="h-4 w-4" /></>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Range: {trend.range} | {chartData.length} data points
        </div>
      </CardFooter>
    </Card>
  )
} 