"use client"

import { TrendingUp } from "lucide-react"
import { LabelList, Pie, PieChart, ResponsiveContainer } from "recharts"
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

export const description = "A dynamic pie chart with label list based on your CSV data"

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

    // Use different categorical column than other charts if possible
    let categoryKey = summary.categoricalColumns[0];
    let valueKey = summary.numericalColumns[0];

    // Try to use a different categorical column for variety
    const usedCategories = [summary.categoricalColumns[0]]; // Assuming first is used by area/bar
    if (summary.categoricalColumns.length > 1) {
      categoryKey = summary.categoricalColumns[1];
    } else if (summary.categoricalColumns.length > 2) {
      categoryKey = summary.categoricalColumns[2];
    }

    // Try to use a different numerical column for variety
    if (summary.numericalColumns.length > 2) {
      valueKey = summary.numericalColumns[2];
    } else if (summary.numericalColumns.length > 1) {
      valueKey = summary.numericalColumns[1];
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
          <CardTitle>Pie Chart - Label List</CardTitle>
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
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart - Label List</CardTitle>
        <CardDescription>
          {categoryKey} distribution by {valueKey}
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
          {insights.dominantPercentage > 50 ? (
            <>"{insights.dominantCategory}" dominates ({insights.dominantPercentage}%) <TrendingUp className="h-4 w-4" /></>
          ) : (
            <>{insights.distribution === 'diverse' ? 'Well distributed data' : 'Concentrated distribution'} <TrendingUp className="h-4 w-4" /></>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Total: {insights.totalCount} | {chartData.length} categories shown
        </div>
      </CardFooter>
    </Card>
  )
} 