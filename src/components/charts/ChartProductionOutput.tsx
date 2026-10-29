"use client"

import { TrendingUp, BarChart2 } from "lucide-react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { useDataStore } from "../../store/dataStore";
import { ChartExplanation } from "../ChartExplanation";
import { detectManufacturingColumns } from "../../lib/manufacturingUtils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

export const description = "Production output over time for manufacturing analysis";

export function ChartProductionOutput() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data for production output analysis
  const { chartData, chartConfig, noData, insights } = useMemo(() => {
    if (!processedData?.rows || processedData.rows.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        noData: true,
        insights: {}
      };
    }

    const { headers, rows } = processedData;
    
    // Detect manufacturing columns
    const manufacturingCols = detectManufacturingColumns(headers);
    
    if (!manufacturingCols.hasWipBatchNo || !manufacturingCols.hasWipQty) {
      return {
        chartData: [],
        chartConfig: {},
        noData: true,
        insights: {}
      };
    }

    // Filter product rows
    const productRows = rows.filter(row => row.WIP_TYPE === 'Product');

    // Group by period and sum WIP_QTY
    const periodMap = new Map();
    productRows.forEach(row => {
      const period = String(row.WIP_PERIOD_NAME || 'Unknown');
      const wipQty = Math.abs(Number(row[manufacturingCols.wipQtyCol!])) || 0;
      
      if (periodMap.has(period)) {
        periodMap.set(period, periodMap.get(period) + wipQty);
      } else {
        periodMap.set(period, wipQty);
      }
    });

    const data = Array.from(periodMap.entries())
      .map(([period, quantity]) => ({
        period,
        quantity
      }))
      .sort((a, b) => {
        // Try to sort by date if period contains date-like strings
        try {
          return (new Date(a.period)).getTime() - (new Date(b.period)).getTime();
        } catch {
          // Fallback to string sort
          return a.period.localeCompare(b.period);
        }
      });

    const totalQty = data.reduce((sum, item) => sum + item.quantity, 0);
    const avgChange = data.length > 1 ? ((data[data.length - 1].quantity - data[0].quantity) / data[0].quantity) * 100 : 0;

    const config = {
      quantity: {
        label: "WIP_QTY",
        color: "hsl(200 80% 50%)",
      }
    } satisfies ChartConfig;

    return {
      chartData: data,
      chartConfig: config,
      noData: false,
      insights: {
        totalQty,
        periodsAnalyzed: data.length,
        avgChange,
        firstPeriod: data.length > 0 ? data[0].period : 'N/A',
        lastPeriod: data.length > 0 ? data[data.length - 1].period : 'N/A'
      }
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Production Output Over Time
          </CardTitle>
          <CardDescription>
            Upload manufacturing data to track production trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>No manufacturing data available. Please upload a CSV file with production information.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative">
      <ChartExplanation
        chartType="Line Chart - Production Output"
        dataKeys={{ xAxisKey: 'period', yAxisKey: 'quantity' }}
        chartData={chartData}
        insights={insights}
      />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          Production Output Over Time
        </CardTitle>
        <CardDescription>
          {insights.firstPeriod} to {insights.lastPeriod} - capturing production volume changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                fontSize={10}
              />
              <YAxis 
                tickFormatter={(value) => `${Number(value).toLocaleString()} KGS`}
              />
              <ChartTooltip
                content={<ChartTooltipContent 
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString()} KGS`,
                    'Production Output'
                  ]}
                  labelFormatter={(label) => `Period: ${label}`}
                />}
              />
              <Line 
                type="monotone"
                dataKey="quantity" 
                stroke="hsl(200 80% 50%)" 
                name="WIP_QTY"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          <BarChart2 className="h-4 w-4" />
          Total production output: {insights.totalQty?.toLocaleString()} KGS
        </div>
        <div className="flex gap-2 font-medium leading-none">
          Average output change: {insights.avgChange?.toFixed(1)}% from first to last period
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Analysis over {insights.periodsAnalyzed} periods - Enhancements in production capacity tracked
        </div>
      </CardFooter>
    </Card>
  );
}
