"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, ResponsiveContainer } from "recharts"
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

export const description = "A dynamic bar chart with custom labels based on your CSV data"

export function ChartBarLabelCustom() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data from CSV
  const { chartData, chartConfig, xAxisKey, yAxisKey, noData, isProductChart } = useMemo(() => {
    if (!processedData?.rows || processedData.rows.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey: '',
        noData: true,
        isProductChart: false
      };
    }

    const { headers, summary } = processedData;
    
    // For bar chart, we need at least one numerical column
    if (summary.numericalColumns.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey: '',
        noData: true,
        isProductChart: false
      };
    }

    // Use first categorical column as category axis, or first column if no categorical
    let xKey = summary.categoricalColumns[0] || headers[0];
    // Use first numerical column as value axis
    let yKey = summary.numericalColumns[0];
    let isProductChart = false;

    // PRIORITY 1: Look for product name columns specifically
    const productNameColumn = headers.find(header => 
      header.toLowerCase().includes('product_name') ||
      header.toLowerCase().includes('productname') ||
      header.toLowerCase() === 'product_name'
    );
    
    // PRIORITY 2: Look for general name columns
    const nameColumn = headers.find(header => 
      header.toLowerCase().includes('name') && 
      !header.toLowerCase().includes('file') &&
      !header.toLowerCase().includes('user')
    );

    // PRIORITY 3: Look for customer segment
    const segmentColumn = headers.find(header => 
      header.toLowerCase().includes('customer_segment') ||
      header.toLowerCase().includes('segment')
    );

    // PRIORITY 4: Look for product category
    const categoryColumn = headers.find(header => 
      header.toLowerCase().includes('product_category') ||
      header.toLowerCase().includes('category')
    );

    // Apply priority order and check if it's in categorical columns
    if (productNameColumn && summary.categoricalColumns.includes(productNameColumn)) {
      xKey = productNameColumn;
      isProductChart = true;
    } else if (nameColumn && summary.categoricalColumns.includes(nameColumn)) {
      xKey = nameColumn;
      isProductChart = true;
    } else if (segmentColumn && summary.categoricalColumns.includes(segmentColumn)) {
      xKey = segmentColumn;
      isProductChart = false;
    } else if (categoryColumn && summary.categoricalColumns.includes(categoryColumn)) {
      xKey = categoryColumn;
      isProductChart = categoryColumn.toLowerCase().includes('product');
    }

    // Smart Y-axis selection for business metrics
    // PRIORITY 1: Sales amount (revenue)
    const salesAmountColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('sales_amount') ||
      col.toLowerCase().includes('revenue')
    );
    
    // PRIORITY 2: Quantity sold
    const quantityColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('quantity_sold') ||
      col.toLowerCase().includes('quantity')
    );
    
    // PRIORITY 3: Price per unit
    const priceColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('price_per') ||
      col.toLowerCase().includes('price')
    );

    if (salesAmountColumn) {
      yKey = salesAmountColumn;
    } else if (quantityColumn) {
      yKey = quantityColumn;
    } else if (priceColumn) {
      yKey = priceColumn;
    }

    // Prepare chart data - limit to first 15 rows for better visualization
    // Group data to avoid too many bars
    const dataMap = new Map();
    processedData.rows.slice(0, 15).forEach(row => {
      const category = String(row[xKey] || 'Unknown');
      const value = Number(row[yKey]) || 0;
      
      if (dataMap.has(category)) {
        dataMap.set(category, dataMap.get(category) + value);
      } else {
        dataMap.set(category, value);
      }
    });

    // Convert map to array and sort by value (descending)
    const data = Array.from(dataMap.entries())
      .map(([category, value]) => ({
        [xKey]: category,
        [yKey]: value,
      }))
      .sort((a, b) => b[yKey] - a[yKey])
      .slice(0, 10); // Top 10 categories

    const config = {
      [yKey]: {
        label: yKey,
        color: "hsl(160 60% 45%)",
      },
      label: {
        color: "hsl(var(--background))",
      },
    } satisfies ChartConfig;

    return {
      chartData: data,
      chartConfig: config,
      xAxisKey: xKey,
      yAxisKey: yKey,
      noData: false,
      isProductChart
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Comparison Analysis</CardTitle>
          <CardDescription>
            Upload CSV data to visualize category comparisons
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

  // Calculate trend based on top vs bottom values
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'stable', percentage: 0 };
    
    const topValue = chartData[0][yAxisKey];
    const avgValue = chartData.reduce((sum, item) => sum + item[yAxisKey], 0) / chartData.length;
    const change = ((topValue - avgValue) / avgValue) * 100;
    
    return {
      direction: change > 20 ? 'up' : change < -20 ? 'down' : 'stable',
      percentage: Math.abs(change).toFixed(1),
      leader: chartData[0][xAxisKey]
    };
  }, [chartData, yAxisKey, xAxisKey]);

  return (
    <Card className="relative">
      <ChartExplanation
        chartType="Bar Chart"
        dataKeys={{ xAxisKey, yAxisKey }}
        chartData={chartData}
        insights={{ trend }}
      />
      <CardHeader>
        <CardTitle>
          {isProductChart 
            ? `Top ${chartData.length} Products by Frequency` 
            : `Top ${chartData.length} ${xAxisKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} by ${yAxisKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
          }
        </CardTitle>
        <CardDescription>
          {isProductChart 
            ? `Top ${chartData.length} products ranked by occurrence frequency` 
            : `Top ${chartData.length} ${xAxisKey.replace(/_/g, ' ').toLowerCase()} by ${yAxisKey.replace(/_/g, ' ').toLowerCase()}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{
                right: 16,
              }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey={xAxisKey}
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => String(value).slice(0, 12)}
                hide
              />
              <XAxis dataKey={yAxisKey} type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar
                dataKey={yAxisKey}
                layout="vertical"
                fill="hsl(160 60% 45%)"
                radius={4}
              >
                <LabelList
                  dataKey={xAxisKey}
                  position="insideLeft"
                  offset={8}
                  className="fill-white"
                  fontSize={12}
                />
                <LabelList
                  dataKey={yAxisKey}
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2 leading-none font-medium">
          {trend.direction === 'up' && (
            <>"{trend.leader}" leads significantly <TrendingUp className="h-4 w-4" /></>
          )}
          {trend.direction === 'down' && (
            <>More balanced distribution <TrendingUp className="h-4 w-4" /></>
          )}
          {trend.direction === 'stable' && (
            <>Fairly distributed values <TrendingUp className="h-4 w-4" /></>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Based on your uploaded data
        </div>
      </CardFooter>
    </Card>
  )
} 