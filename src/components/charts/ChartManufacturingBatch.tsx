"use client"

import { TrendingUp, Factory, DollarSign } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, ResponsiveContainer, 
         Line, LineChart, Tooltip, Legend } from "recharts"
import { useMemo } from "react"
import { useDataStore } from "../../store/dataStore"
import { ChartExplanation } from "../ChartExplanation"
import { detectManufacturingColumns, calculateBatchEfficiency, 
         formatDate, getMonthYear } from "../../lib/manufacturingUtils"

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

export const description = "Manufacturing batch cost and efficiency analysis"

export function ChartManufacturingBatch() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data for manufacturing analysis
  const { chartData, chartConfig, noData, isManufacturingData, insights } = useMemo(() => {
    if (!processedData?.rows || processedData.rows.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        noData: true,
        isManufacturingData: false,
        insights: {}
      };
    }

    const { headers, rows, summary } = processedData;
    
    // Detect manufacturing columns
    const manufacturingCols = detectManufacturingColumns(headers);
    
    if (!manufacturingCols.hasWipBatchNo || !manufacturingCols.hasWipValue) {
      return {
        chartData: [],
        chartConfig: {},
        noData: true,
        isManufacturingData: false,
        insights: {}
      };
    }

    // Group data by batch and calculate metrics
    const batchMap = new Map();
    const productRows = rows.filter(row => row.WIP_TYPE === 'Product');
    
    productRows.forEach(row => {
      const batchNo = String(row[manufacturingCols.wipBatchNoCol!] || 'Unknown');
      const wipValue = Number(row[manufacturingCols.wipValueCol!]) || 0;
      const wipQty = Number(row[manufacturingCols.wipQtyCol!]) || 0;
      const planQty = Number(row[manufacturingCols.planQtyCol!]) || 0;
      const startDateValue = row[manufacturingCols.wipStartDateCol!];
      
      if (!batchMap.has(batchNo)) {
        batchMap.set(batchNo, {
          batchNo,
          totalValue: 0,
          totalQty: 0,
          totalPlan: 0,
          period: startDateValue ? getMonthYear(startDateValue) : 'Unknown',
          startDate: startDateValue ? formatDate(startDateValue) : 'Unknown'
        });
      }
      
      const batch = batchMap.get(batchNo);
      batch.totalValue += wipValue;
      batch.totalQty += wipQty;
      batch.totalPlan += planQty;
    });

    // Convert to array and calculate efficiency
    const data = Array.from(batchMap.values())
      .map(batch => ({
        ...batch,
        efficiency: batch.totalPlan > 0 ? ((batch.totalQty / batch.totalPlan) * 100) : 0,
        costPerUnit: batch.totalQty > 0 ? (batch.totalValue / batch.totalQty) : 0
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 15); // Top 15 batches by value

    // Calculate insights
    const totalValue = data.reduce((sum, batch) => sum + batch.totalValue, 0);
    const avgEfficiency = data.reduce((sum, batch) => sum + batch.efficiency, 0) / data.length;
    const topBatch = data[0];
    const lowEfficiencyBatches = data.filter(batch => batch.efficiency < 90).length;

    const config = {
      totalValue: {
        label: "Batch Value",
        color: "hsl(220 70% 50%)",
      },
      efficiency: {
        label: "Efficiency %",
        color: "hsl(160 60% 45%)",
      },
      costPerUnit: {
        label: "Cost per Unit",
        color: "hsl(30 80% 55%)",
      }
    } satisfies ChartConfig;

    return {
      chartData: data,
      chartConfig: config,
      noData: false,
      isManufacturingData: true,
      insights: {
        totalValue,
        avgEfficiency,
        topBatch,
        lowEfficiencyBatches,
        totalBatches: data.length
      }
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Manufacturing Batch Analysis
          </CardTitle>
          <CardDescription>
            Upload manufacturing data to analyze batch costs and efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>No manufacturing data available. Please upload a CSV file with batch information.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isManufacturingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Manufacturing Batch Analysis
          </CardTitle>
          <CardDescription>
            This chart requires manufacturing data with batch numbers and values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>Manufacturing columns not detected in your data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative">
      <ChartExplanation
        chartType="Manufacturing Batch Analysis"
        dataKeys={{ xAxisKey: 'batchNo', yAxisKey: 'totalValue' }}
        chartData={chartData}
        insights={insights}
      />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="h-5 w-5" />
          Top Manufacturing Batches by Value
        </CardTitle>
        <CardDescription>
          Analysis of {chartData.length} highest-value production batches with efficiency metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
                dataKey="batchNo"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                fontSize={10}
              />
              <YAxis yAxisId="value" orientation="left" />
              <YAxis yAxisId="efficiency" orientation="right" />
              <ChartTooltip
                content={<ChartTooltipContent 
                  formatter={(value, name) => [
                    name === 'totalValue' ? `$${Number(value).toLocaleString()}` : 
                    name === 'efficiency' ? `${Number(value).toFixed(1)}%` :
                    Number(value).toFixed(2),
                    name === 'totalValue' ? 'Batch Value' :
                    name === 'efficiency' ? 'Efficiency' : 'Cost per Unit'
                  ]}
                />}
              />
              <Bar 
                yAxisId="value"
                dataKey="totalValue" 
                fill="hsl(220 70% 50%)" 
                name="Batch Value"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="efficiency"
                  position="top"
                  formatter={(value: number) => `${value.toFixed(0)}%`}
                  fontSize={10}
                  fill="hsl(160 60% 45%)"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          <DollarSign className="h-4 w-4" />
          Total batch value: ${insights.totalValue?.toLocaleString()}
        </div>
        <div className="flex gap-2 font-medium leading-none">
          Average efficiency: {insights.avgEfficiency?.toFixed(1)}% 
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          {insights.lowEfficiencyBatches} batches below 90% efficiency target
        </div>
      </CardFooter>
    </Card>
  )
}
