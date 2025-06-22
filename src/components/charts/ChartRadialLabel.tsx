"use client"

import { TrendingUp } from "lucide-react"
import { LabelList, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts"
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

export const description = "A dynamic radial chart with labels based on your CSV data"

const RADIAL_COLORS = [
  "hsl(220 70% 50%)", // chart-1  
  "hsl(160 60% 45%)", // chart-2
  "hsl(30 80% 55%)",  // chart-3
  "hsl(280 65% 60%)", // chart-4
  "hsl(340 75% 55%)", // chart-5
]

export function ChartRadialLabel() {
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
        insights: { maxValue: 0, totalSum: 0, categories: 0 }
      };
    }

    const { headers, summary } = processedData;
    
    // For radial chart, we need at least one categorical and one numerical column
    if (summary.numericalColumns.length === 0 || summary.categoricalColumns.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        categoryKey: '',
        valueKey: '',
        noData: true,
        insights: { maxValue: 0, totalSum: 0, categories: 0 }
      };
    }

    // Try to use unique columns - prefer different from pie chart
    let categoryKey = summary.categoricalColumns[0];
    let valueKey = summary.numericalColumns[0];

    // If we have multiple categorical columns, try to use a different one
    if (summary.categoricalColumns.length > 2) {
      categoryKey = summary.categoricalColumns[2]; // Different from pie (index 1)
    } else if (summary.categoricalColumns.length > 1) {
      categoryKey = summary.categoricalColumns[0]; // Use first if only 2 available
    }

    // If we have multiple numerical columns, try to use a different one
    if (summary.numericalColumns.length > 3) {
      valueKey = summary.numericalColumns[3]; // Different from others
    } else if (summary.numericalColumns.length > 2) {
      valueKey = summary.numericalColumns[2];
    } else if (summary.numericalColumns.length > 1) {
      valueKey = summary.numericalColumns[0]; // Fallback to first
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

    // Convert to array and sort by value (descending)
    const sortedData = Array.from(dataMap.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 for radial chart

    // Find max value for scaling
    const maxValue = Math.max(...sortedData.map(item => item.value));
    const totalSum = sortedData.reduce((sum, item) => sum + item.value, 0);

    // Prepare data with colors and normalized values for radial display
    const data = sortedData.map((item, index) => ({
      [categoryKey]: item.category,
      [valueKey]: item.value,
      fill: RADIAL_COLORS[index % RADIAL_COLORS.length],
      // Normalize for radial display (minimum 20% for visibility)
      normalizedValue: Math.max(20, (item.value / maxValue) * 100)
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
        color: RADIAL_COLORS[index % RADIAL_COLORS.length],
      };
    });

    return {
      chartData: data,
      chartConfig: config,
      categoryKey,
      valueKey,
      noData: false,
      insights: {
        maxValue,
        totalSum,
        categories: sortedData.length,
        leader: sortedData[0]?.category || '',
        leaderValue: sortedData[0]?.value || 0
      }
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Top Categories Analysis</CardTitle>
          <CardDescription>
            Upload CSV data to visualize proportional relationships
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
        chartType="Radial Chart"
        dataKeys={{ categoryKey, valueKey }}
        chartData={chartData}
        insights={insights}
      />
      <CardHeader className="items-center pb-0">
        <CardTitle>Top {chartData.length} {categoryKey.replace(/_/g, ' ')} by {valueKey.replace(/_/g, ' ')}</CardTitle>
        <CardDescription>
          Top {chartData.length} {categoryKey.replace(/_/g, ' ').toLowerCase()} by {valueKey.replace(/_/g, ' ').toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={chartData}
              startAngle={-90}
              endAngle={380}
              innerRadius={30}
              outerRadius={110}
            >
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey={categoryKey} />}
              />
              <RadialBar
                dataKey="normalizedValue" 
                background
                cornerRadius={4}
              >
                <LabelList
                  position="insideStart"
                  dataKey={categoryKey}
                  className="fill-white capitalize mix-blend-luminosity"
                  fontSize={9}
                  formatter={(value: string) => String(value).slice(0, 6)}
                />
              </RadialBar>
            </RadialBarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {insights.leaderValue > insights.totalSum * 0.4 ? (
            <>"{insights.leader}" leads significantly <TrendingUp className="h-4 w-4" /></>
          ) : (
            <>Balanced distribution across categories <TrendingUp className="h-4 w-4" /></>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Max: {insights.maxValue} | Total: {insights.totalSum} | {insights.categories} categories
        </div>
      </CardFooter>
    </Card>
  )
} 