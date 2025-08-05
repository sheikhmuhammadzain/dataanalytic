"use client"

import { TrendingUp, DollarSign } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
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

export const description = "Cost contribution of ingredients for manufacturing batch analysis";

export function ChartIngredientCostContribution() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data for ingredient cost analysis
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
    
    if (!manufacturingCols.hasWipBatchNo || !manufacturingCols.hasWipValue) {
      return {
        chartData: [],
        chartConfig: {},
        noData: true,
        insights: {}
      };
    }

    // Focus on a specific batch (250602843) and ingredients only
    const targetBatch = "250602843";
    const ingredientRows = rows.filter(row => 
      row.WIP_TYPE === 'Ingredient' && 
      String(row[manufacturingCols.wipBatchNoCol!]) === targetBatch
    );

    if (ingredientRows.length === 0) {
      // If specific batch not found, use any batch with ingredients
      const ingredientRowsAny = rows.filter(row => row.WIP_TYPE === 'Ingredient');
      if (ingredientRowsAny.length === 0) {
        return {
          chartData: [],
          chartConfig: {},
          noData: true,
          insights: {}
        };
      }
      
      // Group by INVENTORY_ITEM_ID and sum WIP_VALUE
      const ingredientMap = new Map();
      ingredientRowsAny.slice(0, 20).forEach(row => {
        const itemId = String(row.INVENTORY_ITEM_ID || 'Unknown');
        const wipValue = Math.abs(Number(row[manufacturingCols.wipValueCol!])) || 0;
        
        if (ingredientMap.has(itemId)) {
          ingredientMap.set(itemId, ingredientMap.get(itemId) + wipValue);
        } else {
          ingredientMap.set(itemId, wipValue);
        }
      });

      const data = Array.from(ingredientMap.entries())
        .map(([itemId, value]) => ({
          itemId,
          wipValue: value,
          displayName: `Item ${itemId}`
        }))
        .sort((a, b) => b.wipValue - a.wipValue)
        .slice(0, 8); // Top 8 ingredients

      const totalValue = data.reduce((sum, item) => sum + item.wipValue, 0);
      const highestCost = data[0];

      const config = {
        wipValue: {
          label: "WIP Value",
          color: "hsl(220 70% 50%)",
        }
      } satisfies ChartConfig;

      return {
        chartData: data,
        chartConfig: config,
        noData: false,
        insights: {
          totalValue,
          highestCost: highestCost?.wipValue || 0,
          topIngredient: highestCost?.itemId || 'N/A',
          batchUsed: 'Multiple batches',
          ingredientCount: data.length
        }
      };
    }

    // Process specific batch ingredients
    const ingredientMap = new Map();
    ingredientRows.forEach(row => {
      const itemId = String(row.INVENTORY_ITEM_ID || 'Unknown');
      const wipValue = Math.abs(Number(row[manufacturingCols.wipValueCol!])) || 0;
      
      if (ingredientMap.has(itemId)) {
        ingredientMap.set(itemId, ingredientMap.get(itemId) + wipValue);
      } else {
        ingredientMap.set(itemId, wipValue);
      }
    });

    const data = Array.from(ingredientMap.entries())
      .map(([itemId, value]) => ({
        itemId,
        wipValue: value,
        displayName: `Item ${itemId}`
      }))
      .sort((a, b) => b.wipValue - a.wipValue);

    const totalValue = data.reduce((sum, item) => sum + item.wipValue, 0);
    const highestCost = data[0];

    const config = {
      wipValue: {
        label: "WIP Value",
        color: "hsl(220 70% 50%)",
      }
    } satisfies ChartConfig;

    return {
      chartData: data,
      chartConfig: config,
      noData: false,
      insights: {
        totalValue,
        highestCost: highestCost?.wipValue || 0,
        topIngredient: highestCost?.itemId || 'N/A',
        batchUsed: targetBatch,
        ingredientCount: data.length
      }
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Ingredient Cost Contribution
          </CardTitle>
          <CardDescription>
            Upload manufacturing data to analyze ingredient costs by batch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>No manufacturing data available. Please upload a CSV file with ingredient information.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative">
      <ChartExplanation
        chartType="Bar Chart - Ingredient Costs"
        dataKeys={{ xAxisKey: 'itemId', yAxisKey: 'wipValue' }}
        chartData={chartData}
        insights={insights}
      />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Ingredient Cost Contribution
        </CardTitle>
        <CardDescription>
          WIP_VALUE comparison for ingredients in batch {insights.batchUsed} - highlighting high-cost items
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
                dataKey="itemId"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                fontSize={10}
                tickFormatter={(value) => `Item ${String(value).slice(-4)}`}
              />
              <YAxis 
                tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
              />
              <ChartTooltip
                content={<ChartTooltipContent 
                  formatter={(value, name) => [
                    `$${Number(value).toLocaleString()}`,
                    'Ingredient Cost'
                  ]}
                  labelFormatter={(label) => `Inventory Item: ${label}`}
                />}
              />
              <Bar 
                dataKey="wipValue" 
                fill="hsl(220 70% 50%)" 
                name="WIP Value"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          <DollarSign className="h-4 w-4" />
          Total ingredient cost: ${insights.totalValue?.toLocaleString()}
        </div>
        <div className="flex gap-2 font-medium leading-none">
          Highest cost ingredient: Item {insights.topIngredient} (${insights.highestCost?.toLocaleString()})
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Analysis of {insights.ingredientCount} ingredients - Cost optimization opportunities identified
        </div>
      </CardFooter>
    </Card>
  );
}
