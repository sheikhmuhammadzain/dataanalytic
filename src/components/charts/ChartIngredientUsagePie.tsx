"use client"

import { TrendingUp, Package } from "lucide-react";
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts";
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

const COLORS = [
  "hsl(220 70% 50%)",
  "hsl(160 60% 45%)", 
  "hsl(30 80% 55%)",
  "hsl(280 65% 60%)",
  "hsl(120 60% 50%)",
  "hsl(10 80% 60%)",
  "hsl(200 80% 50%)",
  "hsl(340 75% 55%)"
];

export const description = "Ingredient usage proportion analysis for manufacturing batch";

export function ChartIngredientUsagePie() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data for ingredient usage analysis
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
      
      // Group by INVENTORY_ITEM_ID and sum absolute WIP_QTY
      const ingredientMap = new Map();
      ingredientRowsAny.slice(0, 20).forEach(row => {
        const itemId = String(row.INVENTORY_ITEM_ID || 'Unknown');
        const wipQty = Math.abs(Number(row[manufacturingCols.wipQtyCol!])) || 0;
        
        if (ingredientMap.has(itemId)) {
          ingredientMap.set(itemId, ingredientMap.get(itemId) + wipQty);
        } else {
          ingredientMap.set(itemId, wipQty);
        }
      });

      const data = Array.from(ingredientMap.entries())
        .map(([itemId, quantity]) => ({
          itemId,
          quantity,
          displayName: `Item ${itemId}`
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8); // Top 8 ingredients

      const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
      
      // Add percentage and color to each item
      const dataWithPercentage = data.map((item, index) => ({
        ...item,
        percentage: totalQuantity > 0 ? ((item.quantity / totalQuantity) * 100) : 0,
        fill: COLORS[index % COLORS.length]
      }));

      const largestIngredient = dataWithPercentage[0];

      const config = dataWithPercentage.reduce((acc, item, index) => {
        acc[item.itemId] = {
          label: `Item ${item.itemId}`,
          color: COLORS[index % COLORS.length]
        };
        return acc;
      }, {} as ChartConfig);

      return {
        chartData: dataWithPercentage,
        chartConfig: config,
        noData: false,
        insights: {
          totalQuantity,
          largestIngredient: largestIngredient?.itemId || 'N/A',
          largestPercentage: largestIngredient?.percentage || 0,
          batchUsed: 'Multiple batches',
          ingredientCount: dataWithPercentage.length
        }
      };
    }

    // Process specific batch ingredients
    const ingredientMap = new Map();
    ingredientRows.forEach(row => {
      const itemId = String(row.INVENTORY_ITEM_ID || 'Unknown');
      const wipQty = Math.abs(Number(row[manufacturingCols.wipQtyCol!])) || 0;
      
      if (ingredientMap.has(itemId)) {
        ingredientMap.set(itemId, ingredientMap.get(itemId) + wipQty);
      } else {
        ingredientMap.set(itemId, wipQty);
      }
    });

    const data = Array.from(ingredientMap.entries())
      .map(([itemId, quantity]) => ({
        itemId,
        quantity,
        displayName: `Item ${itemId}`
      }))
      .sort((a, b) => b.quantity - a.quantity);

    const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
    
    // Add percentage and color to each item
    const dataWithPercentage = data.map((item, index) => ({
      ...item,
      percentage: totalQuantity > 0 ? ((item.quantity / totalQuantity) * 100) : 0,
      fill: COLORS[index % COLORS.length]
    }));

    const largestIngredient = dataWithPercentage[0];

    const config = dataWithPercentage.reduce((acc, item, index) => {
      acc[item.itemId] = {
        label: `Item ${item.itemId}`,
        color: COLORS[index % COLORS.length]
      };
      return acc;
    }, {} as ChartConfig);

    return {
      chartData: dataWithPercentage,
      chartConfig: config,
      noData: false,
      insights: {
        totalQuantity,
        largestIngredient: largestIngredient?.itemId || 'N/A',
        largestPercentage: largestIngredient?.percentage || 0,
        batchUsed: targetBatch,
        ingredientCount: dataWithPercentage.length
      }
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ingredient Usage Proportion
          </CardTitle>
          <CardDescription>
            Upload manufacturing data to analyze ingredient usage proportions
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
        chartType="Pie Chart - Ingredient Usage"
        dataKeys={{ xAxisKey: 'itemId', yAxisKey: 'quantity' }}
        chartData={chartData}
        insights={insights}
      />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Ingredient Usage Proportion
        </CardTitle>
        <CardDescription>
          WIP_QTY distribution for ingredients in batch {insights.batchUsed} - material consumption analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent 
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString()} KGS (${chartData.find(d => d.itemId === name)?.percentage?.toFixed(1)}%)`,
                    `Item ${name}`
                  ]}
                />}
              />
              <Pie
                data={chartData}
                dataKey="quantity"
                nameKey="itemId"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                label={({ itemId, percentage }) => 
                  percentage > 5 ? `${String(itemId).slice(-4)}: ${percentage.toFixed(1)}%` : ''
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          <Package className="h-4 w-4" />
          Total ingredient usage: {insights.totalQuantity?.toLocaleString()} KGS
        </div>
        <div className="flex gap-2 font-medium leading-none">
          Dominant ingredient: Item {insights.largestIngredient} ({insights.largestPercentage?.toFixed(1)}% of total)
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Analysis of {insights.ingredientCount} ingredients - Critical materials for inventory management
        </div>
      </CardFooter>
    </Card>
  );
}
