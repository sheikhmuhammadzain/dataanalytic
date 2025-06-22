"use client"

import { TrendingUp } from "lucide-react"
import { LabelList, Pie, PieChart, ResponsiveContainer } from "recharts"
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

export const description = "A dynamic pie chart with labels based on your CSV data"

const PIE_COLORS = [
  "hsl(220 70% 50%)", // chart-1
  "hsl(160 60% 45%)", // chart-2
  "hsl(30 80% 55%)",  // chart-3
  "hsl(280 65% 60%)", // chart-4
  "hsl(340 75% 55%)", // chart-5
]

export function ChartPieLabelList() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data from CSV
  const { chartData, chartConfig, categoryKey, valueKey, noData, insights } = useMemo(() => {
    if (!processedData?.rows || processedData.rows.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        categoryKey: '',
        valueKey: '',
        noData: true,
        insights: { totalCount: 0, dominantCategory: '', dominantPercentage: 0 }
      };
    }

    const { headers, summary } = processedData;
    
    // For pie chart, we need at least one categorical and one numerical column
    if (summary.numericalColumns.length === 0 || summary.categoricalColumns.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        categoryKey: '',
        valueKey: '',
        noData: true,
        insights: { totalCount: 0, dominantCategory: '', dominantPercentage: 0 }
      };
    }

    // Smart category selection for business insights
    // PRIORITY 1: Product names for product performance analysis
    const productNameColumn = headers.find(header => 
      header.toLowerCase().includes('product_name') ||
      header.toLowerCase().includes('productname') ||
      header.toLowerCase() === 'product_name'
    );
    
    // PRIORITY 2: Product categories for product mix analysis
    const productCategoryColumn = headers.find(header => 
      header.toLowerCase().includes('product_category') ||
      header.toLowerCase().includes('category')
    );
    
    // PRIORITY 3: Customer segments for market analysis
    const segmentColumn = headers.find(header => 
      header.toLowerCase().includes('customer_segment') ||
      header.toLowerCase().includes('segment')
    );

    let categoryKey = summary.categoricalColumns[0];
    let valueKey = summary.numericalColumns[0];

    // Apply priority for category selection - Product names first!
    if (productNameColumn && summary.categoricalColumns.includes(productNameColumn)) {
      categoryKey = productNameColumn;
    } else if (productCategoryColumn && summary.categoricalColumns.includes(productCategoryColumn)) {
      categoryKey = productCategoryColumn;
    } else if (segmentColumn && summary.categoricalColumns.includes(segmentColumn)) {
      categoryKey = segmentColumn;
    }

    // Smart value selection for business metrics
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
    
    // PRIORITY 3: Stock level
    const stockColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('stock_level') ||
      col.toLowerCase().includes('stock')
    );

    if (salesAmountColumn) {
      valueKey = salesAmountColumn;
    } else if (quantityColumn) {
      valueKey = quantityColumn;
    } else if (stockColumn) {
      valueKey = stockColumn;
    }

    // Aggregate data by category
    const dataMap = new Map();
    processedData.rows.forEach(row => {
      const category = String(row[categoryKey] || 'Unknown');
      const value = Number(row[valueKey]) || 0;
      
      if (dataMap.has(category)) {
        dataMap.set(category, dataMap.get(category) + value);
      } else {
        dataMap.set(category, value);
      }
    });

    // Convert to array and sort by value
    const sortedData = Array.from(dataMap.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 for better pie chart readability

    // Calculate total for percentages
    const total = sortedData.reduce((sum, item) => sum + item.value, 0);

    // Prepare data with colors and fills
    const data = sortedData.map((item, index) => ({
      [categoryKey]: item.category,
      [valueKey]: item.value,
      fill: PIE_COLORS[index % PIE_COLORS.length],
      percentage: ((item.value / total) * 100).toFixed(1)
    }));

    // Create dynamic config
    const config: ChartConfig = {
      [valueKey]: {
        label: valueKey,
      },
    };

    // Add color config for each category
    sortedData.forEach((item, index) => {
      config[item.category] = {
        label: item.category,
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
    });

    // Calculate insights
    const dominantCategory = sortedData[0]?.category || '';
    const dominantPercentage = sortedData[0] ? ((sortedData[0].value / total) * 100) : 0;

    return {
      chartData: data,
      chartConfig: config,
      categoryKey,
      valueKey,
      noData: false,
      insights: {
        totalCount: total,
        dominantCategory,
        dominantPercentage: dominantPercentage.toFixed(1),
        distribution: sortedData.length > 3 ? 'diverse' : 'concentrated'
      }
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Category Distribution Analysis</CardTitle>
          <CardDescription>
            Upload CSV data to visualize category distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-60 text-muted-foreground">
            <p>No data available. Please upload a CSV file.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col relative">
      <ChartExplanation
        chartType="Pie Chart"
        dataKeys={{ categoryKey, valueKey }}
        chartData={chartData}
        insights={insights}
      />
      <CardHeader className="items-center pb-0">
        <CardTitle>
          {categoryKey.toLowerCase().includes('product') 
            ? `Product Sales Distribution` 
            : `${categoryKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Distribution by ${valueKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
          }
        </CardTitle>
        <CardDescription>
          {categoryKey.toLowerCase().includes('product') 
            ? `Product performance by ${valueKey.replace(/_/g, ' ').toLowerCase()}` 
            : `${categoryKey.replace(/_/g, ' ').toLowerCase()} distribution by ${valueKey.replace(/_/g, ' ').toLowerCase()}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey={valueKey} hideLabel />}
              />
              <Pie 
                data={chartData} 
                dataKey={valueKey}
                nameKey={categoryKey}
                cx="50%"
                cy="50%"
                outerRadius="80%"
              >
                <LabelList
                  dataKey={categoryKey}
                  className="fill-background"
                  stroke="none"
                  fontSize={10}
                  formatter={(value: string) => String(value).slice(0, 8)}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {insights.distribution === 'diverse' ? (
            <>Well distributed across {categoryKey.toLowerCase().includes('product') ? 'products' : 'categories'} <TrendingUp className="h-4 w-4" /></>
          ) : (
            <>"{insights.dominantCategory}" dominates with {insights.dominantPercentage}% <TrendingUp className="h-4 w-4" /></>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Total: {insights.totalCount.toLocaleString()} | {chartData.length} {categoryKey.toLowerCase().includes('product') ? 'products' : 'categories'} shown
        </div>
      </CardFooter>
    </Card>
  );
} 