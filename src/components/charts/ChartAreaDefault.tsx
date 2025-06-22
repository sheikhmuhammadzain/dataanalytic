"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
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

export const description = "A dynamic area chart showing business trends over time"

export function ChartAreaDefault() {
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
    
    // For area chart, we need at least one numerical column
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

    // Smart X-axis selection - prioritize time-based columns
    let xKey = summary.categoricalColumns[0] || headers[0];
    let isTimeSeries = false;

    // PRIORITY 1: Look for date/time columns
    const dateColumn = headers.find(header => 
      header.toLowerCase().includes('date') || 
      header.toLowerCase().includes('time') ||
      header.toLowerCase().includes('month') ||
      header.toLowerCase().includes('year') ||
      header.toLowerCase().includes('quarter') ||
      header.toLowerCase().includes('period')
    );
    
    if (dateColumn) {
      xKey = dateColumn;
      isTimeSeries = true;
    } else {
      // PRIORITY 2: Look for meaningful categorical data
      const segmentColumn = headers.find(header => 
        header.toLowerCase().includes('customer_segment') ||
        header.toLowerCase().includes('segment')
      );
      const categoryColumn = headers.find(header => 
        header.toLowerCase().includes('product_category') ||
        header.toLowerCase().includes('category')
      );
      
      if (segmentColumn && summary.categoricalColumns.includes(segmentColumn)) {
        xKey = segmentColumn;
      } else if (categoryColumn && summary.categoricalColumns.includes(categoryColumn)) {
        xKey = categoryColumn;
      }
    }

    // Smart Y-axis selection - prioritize business metrics
    let yKey = summary.numericalColumns[0];

    // PRIORITY 1: Sales amount (revenue)
    const salesAmountColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('sales_amount') ||
      col.toLowerCase().includes('revenue') ||
      col.toLowerCase().includes('total_sales')
    );
    
    // PRIORITY 2: Quantity sold
    const quantityColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('quantity_sold') ||
      col.toLowerCase().includes('quantity') ||
      col.toLowerCase().includes('volume')
    );
    
    // PRIORITY 3: Sales targets
    const targetColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('sales_target') ||
      col.toLowerCase().includes('target')
    );

    // PRIORITY 4: Stock levels
    const stockColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('stock_level') ||
      col.toLowerCase().includes('stock') ||
      col.toLowerCase().includes('inventory')
    );

    if (salesAmountColumn) {
      yKey = salesAmountColumn;
    } else if (quantityColumn) {
      yKey = quantityColumn;
    } else if (targetColumn) {
      yKey = targetColumn;
    } else if (stockColumn) {
      yKey = stockColumn;
    }

    // Aggregate data properly for meaningful trends
    const dataMap = new Map();
    processedData.rows.forEach(row => {
      const xValue = String(row[xKey] || 'Unknown');
      const yValue = Number(row[yKey]) || 0;
      
      if (dataMap.has(xValue)) {
        // For time series and business data, sum the values
        dataMap.set(xValue, dataMap.get(xValue) + yValue);
      } else {
        dataMap.set(xValue, yValue);
      }
    });

    // Convert to array and sort appropriately
    let data = Array.from(dataMap.entries()).map(([key, value]) => ({
      [xKey]: key,
      [yKey]: Math.round(value * 100) / 100, // Round to 2 decimal places
    }));

    // Sort data for better visualization
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
      // For categories, sort by value to show trends
      data = data.sort((a, b) => a[yKey] - b[yKey]);
    }

    // Limit to reasonable number of points for area chart
    data = data.slice(0, 20);

    const config = {
      [yKey]: {
        label: yKey.replace(/_/g, ' '),
        color: "hsl(220 70% 50%)",
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
          <CardTitle>Business Trends Analysis</CardTitle>
          <CardDescription>
            Upload CSV data to visualize business trends over time
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

  // Calculate trend with better analysis
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'stable', percentage: 0, peak: 0, total: 0 };
    
    const values = chartData.map(d => d[yAxisKey]);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = ((lastValue - firstValue) / firstValue) * 100;
    const peak = Math.max(...values);
    const total = values.reduce((sum, val) => sum + val, 0);
    
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      percentage: Math.abs(change).toFixed(1),
      peak: peak.toLocaleString(),
      total: total.toLocaleString()
    };
  }, [chartData, yAxisKey]);

  // Create meaningful title based on data
  const chartTitle = useMemo(() => {
    const yLabel = yAxisKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const xLabel = xAxisKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    if (isTimeSeries) {
      return `${yLabel} Trends Over Time`;
    } else {
      return `${yLabel} Distribution by ${xLabel}`;
    }
  }, [yAxisKey, xAxisKey, isTimeSeries]);

  return (
    <Card className="relative">
      <ChartExplanation
        chartType="Area Chart"
        dataKeys={{ xAxisKey, yAxisKey }}
        chartData={chartData}
        insights={{ trend, isTimeSeries }}
      />
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <CardDescription>
          {isTimeSeries 
            ? `Showing ${yAxisKey.replace(/_/g, ' ').toLowerCase()} trends over time periods`
            : `Showing ${yAxisKey.replace(/_/g, ' ').toLowerCase()} distribution across ${xAxisKey.replace(/_/g, ' ').toLowerCase()}`
          }
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
                top: 12,
                bottom: 12
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={isTimeSeries ? -45 : 0}
                textAnchor={isTimeSeries ? "end" : "middle"}
                height={isTimeSeries ? 60 : 30}
                tickFormatter={(value) => String(value).slice(0, 12)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <ChartTooltip
                cursor={{ stroke: "hsl(220 70% 50%)", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={<ChartTooltipContent indicator="dot" labelKey={xAxisKey} nameKey={yAxisKey} />}
              />
              <Area
                dataKey={yAxisKey}
                type="monotone"
                fill="hsl(220 70% 50%)"
                fillOpacity={0.3}
                stroke="hsl(220 70% 50%)"
                strokeWidth={2}
                dot={{
                  fill: "hsl(220 70% 50%)",
                  r: 4,
                  strokeWidth: 2,
                  stroke: "#fff"
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: "#fff"
                }}
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
                <>Declining by {trend.percentage}% <TrendingUp className="h-4 w-4 rotate-180" /></>
              )}
              {trend.direction === 'stable' && (
                <>Relatively stable trend <TrendingUp className="h-4 w-4" /></>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Peak: {trend.peak} | Total: {trend.total} | {chartData.length} data points
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
} 