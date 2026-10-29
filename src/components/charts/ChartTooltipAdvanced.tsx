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

export const description = "Product performance chart showing production vs sales by product names"

export function ChartTooltipAdvanced() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data from CSV focusing on product performance
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
    
    // Focus on product-related analysis
    // Find product name column (prioritize product_name over others)
    const productNameColumn = headers.find(h => 
      h.toLowerCase().includes('product_name') || 
      h.toLowerCase().includes('product name') ||
      h.toLowerCase().includes('productname')
    ) || headers.find(h => 
      h.toLowerCase().includes('product') || 
      h.toLowerCase().includes('name') ||
      h.toLowerCase().includes('item')
    );

    // Find sales/revenue column
    const salesColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('sales_amount') ||
      col.toLowerCase().includes('sales') ||
      col.toLowerCase().includes('revenue')
    );
    
    // Find production/quantity column  
    const productionColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('quantity_sold') ||
      col.toLowerCase().includes('quantity') ||
      col.toLowerCase().includes('production') ||
      col.toLowerCase().includes('units') ||
      col.toLowerCase().includes('volume')
    );

    // If we don't have the required columns, show no data
    if (!productNameColumn || !salesColumn || !productionColumn) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey1: '',
        yAxisKey2: '',
        noData: true
      };
    }

    const xKey = productNameColumn;
    const yKey1 = productionColumn; // Production/Quantity
    const yKey2 = salesColumn;      // Sales Amount

    // Aggregate data by product name
    const dataMap = new Map();
    
    processedData.rows.forEach(row => {
      const productName = String(row[xKey] || 'Unknown').trim();
      const production = Number(row[yKey1]) || 0;
      const sales = Number(row[yKey2]) || 0;
      
      if (dataMap.has(productName)) {
        const existing = dataMap.get(productName);
        dataMap.set(productName, {
          production: existing.production + production,
          sales: existing.sales + sales
        });
      } else {
        dataMap.set(productName, { production, sales });
      }
    });

    // Convert to array and sort by total performance (production + sales)
    const rawData = Array.from(dataMap.entries())
      .map(([productName, values]) => ({
        [xKey]: productName,
        [yKey1]: Math.round(values.production * 100) / 100,
        [yKey2]: Math.round(values.sales * 100) / 100,
        total: values.production + values.sales
      }))
      .filter(item => item[yKey1] > 0 || item[yKey2] > 0) // Remove empty entries
      .sort((a, b) => b.total - a.total) // Sort by total performance
      .slice(0, 8); // Top 8 products for clarity

    // Check if scaling is needed (if values are very different in magnitude)
    const allProductionValues = rawData.map(item => item[yKey1]);
    const allSalesValues = rawData.map(item => item[yKey2]);
    
    const maxProduction = Math.max(...allProductionValues);
    const maxSales = Math.max(...allSalesValues);
    
    // Scale if difference is more than 100x
    const needsScaling = maxSales / maxProduction > 100 || maxProduction / maxSales > 100;
    
    let data = rawData.map(item => {
      let scaledProduction = item[yKey1];
      let scaledSales = item[yKey2];
      
      if (needsScaling) {
        // Normalize both to 0-100 scale for better visualization
        scaledProduction = (item[yKey1] / maxProduction) * 100;
        scaledSales = (item[yKey2] / maxSales) * 100;
      }
      
      return {
        [xKey]: item[xKey],
        [yKey1]: Math.round(scaledProduction * 100) / 100,
        [yKey2]: Math.round(scaledSales * 100) / 100,
        // Keep original values for tooltips
        [`${yKey1}_original`]: item[yKey1],
        [`${yKey2}_original`]: item[yKey2],
        isScaled: needsScaling
      };
    });

    const config = {
      [yKey1]: {
        label: "Production",
        color: "hsl(160 60% 45%)", // Green for production
      },
      [yKey2]: {
        label: "Sales",
        color: "hsl(220 70% 50%)", // Blue for sales
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
          <CardTitle>Product Performance Analysis</CardTitle>
          <CardDescription>
            Upload CSV with product names, production/quantity, and sales data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>No product data available. Please upload a CSV file with product information.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate performance metrics
  const topProduct = chartData[0];
  const totalProducts = chartData.length;

  return (
    <Card className="relative">
      <ChartExplanation
        chartType="Stacked Bar Chart"
        dataKeys={{ xAxisKey, yAxisKey1, yAxisKey2 }}
        chartData={chartData}
        insights={{ topProduct: topProduct[xAxisKey], totalProducts }}
      />
      <CardHeader>
        <CardTitle>Product Performance by Names</CardTitle>
        <CardDescription>
          Production vs Sales comparison for top {totalProducts} products
          {chartData[0]?.isScaled && " • Values are scaled for visualization"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={(value) => String(value).slice(0, 15)} // Truncate long names
              />
              <ChartTooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
                content={
                  <ChartTooltipContent
                    className="w-40"
                    formatter={(value, name, props) => {
                      // Show original values if scaled
                      if (props.payload?.isScaled) {
                        const originalKey = `${name}_original`;
                        const originalValue = props.payload[originalKey];
                        if (originalValue !== undefined) {
                          return [
                            originalValue.toLocaleString(),
                            name === yAxisKey1 ? 'Production' : 'Sales'
                          ];
                        }
                      }
                      return [value.toLocaleString(), name === yAxisKey1 ? 'Production' : 'Sales'];
                    }}
                  />
                }
              />
              <Bar
                dataKey={yAxisKey1}
                stackId="a"
                fill="hsl(160 60% 45%)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey={yAxisKey2}
                stackId="a"
                fill="hsl(220 70% 50%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Top performer: {topProduct[xAxisKey]} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing {totalProducts} products with highest combined performance
        </div>
      </CardFooter>
    </Card>
  )
} 