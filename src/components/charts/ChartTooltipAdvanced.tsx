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

export const description = "A stacked bar chart with advanced tooltip showing meaningful business comparisons"

export function ChartTooltipAdvanced() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare chart data from CSV
  const { chartData, chartConfig, xAxisKey, yAxisKey1, yAxisKey2, noData, chartTitle } = useMemo(() => {
    if (!processedData?.rows || processedData.rows.length === 0) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey1: '',
        yAxisKey2: '',
        noData: true,
        chartTitle: 'Business Comparison Analysis'
      };
    }

    const { headers, summary } = processedData;
    
    // For stacked chart, we need at least two numerical columns and one categorical
    if (summary.numericalColumns.length < 2) {
      return {
        chartData: [],
        chartConfig: {},
        xAxisKey: '',
        yAxisKey1: '',
        yAxisKey2: '',
        noData: true,
        chartTitle: 'Business Comparison Analysis'
      };
    }

    // Smart column selection - exclude ID columns and technical fields
    const meaningfulColumns = summary.numericalColumns.filter(col => {
      const lowerCol = col.toLowerCase();
      return !lowerCol.includes('id') && 
             !lowerCol.includes('transaction_id') &&
             !lowerCol.includes('customer_id') &&
             !lowerCol.includes('product_id') &&
             !lowerCol.includes('user_id') &&
             !lowerCol.includes('order_id');
    });

    // If we don't have enough meaningful columns, use all numerical columns
    const availableColumns = meaningfulColumns.length >= 2 ? meaningfulColumns : summary.numericalColumns;

    // Prioritize business-relevant column pairs
    let yKey1: string, yKey2: string;
    let xKey = summary.categoricalColumns[0] || headers[0];

    // PRIORITY 1: Sales Amount vs Quantity (most common business comparison)
    const salesColumn = availableColumns.find(col => 
      col.toLowerCase().includes('sales_amount') ||
      col.toLowerCase().includes('revenue') ||
      col.toLowerCase().includes('total_sales') ||
      col.toLowerCase().includes('sales')
    );
    
    const quantityColumn = availableColumns.find(col => 
      col.toLowerCase().includes('quantity_sold') ||
      col.toLowerCase().includes('quantity') ||
      col.toLowerCase().includes('volume') ||
      col.toLowerCase().includes('units')
    );

    // PRIORITY 2: Actual vs Target comparison
    const actualColumn = availableColumns.find(col => 
      col.toLowerCase().includes('actual') ||
      col.toLowerCase().includes('achieved')
    );
    
    const targetColumn = availableColumns.find(col => 
      col.toLowerCase().includes('target') ||
      col.toLowerCase().includes('goal') ||
      col.toLowerCase().includes('budget')
    );

    // PRIORITY 3: Cost vs Revenue comparison
    const revenueColumn = availableColumns.find(col => 
      col.toLowerCase().includes('revenue') ||
      col.toLowerCase().includes('income')
    );
    
    const costColumn = availableColumns.find(col => 
      col.toLowerCase().includes('cost') ||
      col.toLowerCase().includes('expense') ||
      col.toLowerCase().includes('spend')
    );

    // PRIORITY 4: Price vs Stock comparison
    const priceColumn = availableColumns.find(col => 
      col.toLowerCase().includes('price') ||
      col.toLowerCase().includes('rate')
    );
    
    const stockColumn = availableColumns.find(col => 
      col.toLowerCase().includes('stock') ||
      col.toLowerCase().includes('inventory')
    );

    // Select the best pair
    if (salesColumn && quantityColumn) {
      yKey1 = salesColumn;
      yKey2 = quantityColumn;
    } else if (actualColumn && targetColumn) {
      yKey1 = actualColumn;
      yKey2 = targetColumn;
    } else if (revenueColumn && costColumn) {
      yKey1 = revenueColumn;
      yKey2 = costColumn;
    } else if (priceColumn && stockColumn) {
      yKey1 = priceColumn;
      yKey2 = stockColumn;
    } else {
      // Fallback to first two meaningful columns
      yKey1 = availableColumns[0];
      yKey2 = availableColumns[1];
    }

    // Smart X-axis selection
    // PRIORITY 1: Date/Time columns for time-based analysis
    const dateColumn = headers.find(header => 
      header.toLowerCase().includes('date') || 
      header.toLowerCase().includes('time') ||
      header.toLowerCase().includes('month') ||
      header.toLowerCase().includes('year') ||
      header.toLowerCase().includes('quarter') ||
      header.toLowerCase().includes('period')
    );
    
    // PRIORITY 2: Business-relevant categorical columns
    const categoryColumn = summary.categoricalColumns.find(col => 
      col.toLowerCase().includes('category') ||
      col.toLowerCase().includes('product_category') ||
      col.toLowerCase().includes('type')
    );
    
    const regionColumn = summary.categoricalColumns.find(col => 
      col.toLowerCase().includes('region') ||
      col.toLowerCase().includes('province') ||
      col.toLowerCase().includes('city') ||
      col.toLowerCase().includes('location')
    );

    if (dateColumn) {
      xKey = dateColumn;
    } else if (categoryColumn) {
      xKey = categoryColumn;
    } else if (regionColumn) {
      xKey = regionColumn;
    } else if (summary.categoricalColumns.length > 0) {
      xKey = summary.categoricalColumns[0];
    }

    // Process data with monthly grouping for dates
    const dataMap = new Map();
    
    processedData.rows.forEach(row => {
      let category = String(row[xKey] || 'Unknown');
      const value1 = Number(row[yKey1]) || 0;
      const value2 = Number(row[yKey2]) || 0;
      
      // Group by month if it's a date column
      if (dateColumn === xKey && category !== 'Unknown') {
        try {
          const date = new Date(category);
          if (!isNaN(date.getTime())) {
            category = date.toLocaleDateString('en-US', { 
              month: 'short', 
              year: 'numeric' 
            });
          }
        } catch (e) {
          // Keep original value if date parsing fails
        }
      }
      
      if (dataMap.has(category)) {
        const existing = dataMap.get(category);
        dataMap.set(category, {
          [yKey1]: existing[yKey1] + value1,
          [yKey2]: existing[yKey2] + value2
        });
      } else {
        dataMap.set(category, {
          [yKey1]: value1,
          [yKey2]: value2
        });
      }
    });

    // Convert map to array with proper scaling
    let rawData = Array.from(dataMap.entries())
      .map(([category, values]) => ({
        [xKey]: category,
        [yKey1]: values[yKey1],
        [yKey2]: values[yKey2],
        rawValue1: values[yKey1],
        rawValue2: values[yKey2]
      }));

    // Check if we need to scale values for better visualization
    // (when one metric is much larger than the other)
    const allValues1 = rawData.map(d => d[yKey1]);
    const allValues2 = rawData.map(d => d[yKey2]);
    const avg1 = allValues1.reduce((sum, val) => sum + val, 0) / allValues1.length;
    const avg2 = allValues2.reduce((sum, val) => sum + val, 0) / allValues2.length;
    
    // If one metric is 10x larger than the other, we need to normalize for visualization
    const scalingRatio = Math.max(avg1, avg2) / Math.min(avg1, avg2);
    const needsScaling = scalingRatio > 10;
    
    let data = rawData.map(item => {
      let scaledValue1 = item[yKey1];
      let scaledValue2 = item[yKey2];
      
      if (needsScaling) {
        // Normalize both values to 0-100 scale for better visualization
        const maxValue1 = Math.max(...allValues1);
        const maxValue2 = Math.max(...allValues2);
        
        scaledValue1 = (item[yKey1] / maxValue1) * 100;
        scaledValue2 = (item[yKey2] / maxValue2) * 100;
      }
      
      return {
        [xKey]: item[xKey],
        [yKey1]: Math.round(scaledValue1 * 100) / 100,
        [yKey2]: Math.round(scaledValue2 * 100) / 100,
        total: Math.round((scaledValue1 + scaledValue2) * 100) / 100,
        // Keep original values for tooltips
        [`${yKey1}_original`]: Math.round(item.rawValue1 * 100) / 100,
        [`${yKey2}_original`]: Math.round(item.rawValue2 * 100) / 100,
        isNormalized: needsScaling
      };
    });

    // Sort data appropriately
    if (dateColumn === xKey) {
      // Sort by date
      data = data.sort((a, b) => {
        const aDate = new Date(a[xKey] + ' 1');
        const bDate = new Date(b[xKey] + ' 1');
        return aDate.getTime() - bDate.getTime();
      });
      // Take last 6 months for time series
      data = data.slice(-6);
    } else {
      // Sort by total value descending and take top 8
      data = data.sort((a, b) => b.total - a.total).slice(0, 8);
    }

    // Generate meaningful chart title
    const yLabel1 = yKey1.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const yLabel2 = yKey2.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const xLabel = xKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    let chartTitle = `${yLabel1} vs ${yLabel2}`;
    if (dateColumn === xKey) {
      chartTitle += ' Over Time';
    } else {
      chartTitle += ` by ${xLabel}`;
    }

    const config = {
      [yKey1]: {
        label: yLabel1,
        color: "hsl(160 60% 45%)",
      },
      [yKey2]: {
        label: yLabel2,
        color: "hsl(220 70% 50%)",
      },
    } satisfies ChartConfig;

    return {
      chartData: data,
      chartConfig: config,
      xAxisKey: xKey,
      yAxisKey1: yKey1,
      yAxisKey2: yKey2,
      noData: false,
      chartTitle
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Comparison Analysis</CardTitle>
          <CardDescription>
            Upload CSV data with multiple numerical columns to compare business metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>No data available. Need at least 2 numerical columns for comparison.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend and insights
  const insights = useMemo(() => {
    if (chartData.length === 0) return { trend: 'stable', balance: 'balanced', totalSum: 0 };
    
    const totals = chartData.map(item => item.total);
    const sum1 = chartData.reduce((sum, item) => sum + item[yAxisKey1], 0);
    const sum2 = chartData.reduce((sum, item) => sum + item[yAxisKey2], 0);
    const totalSum = sum1 + sum2;
    
    const avgTotal = totals.reduce((sum, val) => sum + val, 0) / totals.length;
    const maxTotal = Math.max(...totals);
    
    // Calculate balance more meaningfully
    const ratio1 = Math.round((sum1/totalSum)*100);
    const ratio2 = Math.round((sum2/totalSum)*100);
    const isBalanced = Math.abs(ratio1 - ratio2) <= 20; // Within 20% is considered balanced
    
    return {
      trend: maxTotal > avgTotal * 1.5 ? 'peaked' : 'consistent',
      balance: isBalanced ? 'balanced' : sum1 > sum2 ? `${yAxisKey1}_dominant` : `${yAxisKey2}_dominant`,
      totalSum: Math.round(totalSum),
      ratio: `${ratio1}:${ratio2}`,
      ratio1,
      ratio2
    };
  }, [chartData, yAxisKey1, yAxisKey2]);

  return (
    <Card className="relative">
      <ChartExplanation
        chartType="Stacked Bar Chart"
        dataKeys={{ xAxisKey, yAxisKey1, yAxisKey2 }}
        chartData={chartData}
        insights={insights}
      />
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <CardDescription>
          Comparative analysis showing the relationship between {yAxisKey1.replace(/_/g, ' ').toLowerCase()} and {yAxisKey2.replace(/_/g, ' ').toLowerCase()}
          {chartData.length > 0 && chartData[0].isNormalized && (
            <span className="block text-xs text-muted-foreground mt-1">
              * Values are scaled for visualization - hover for actual values
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => String(value).slice(0, 10)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent 
                    hideLabel
                    className="w-56"
                    formatter={(value, name, item) => {
                      const originalKey = `${name}_original`;
                      const originalValue = item.payload[originalKey];
                      const isNormalized = item.payload.isNormalized;
                      
                      return (
                        <>
                          <div className="h-2 w-2 shrink-0 rounded-[2px] bg-[--color-bg]" 
                               style={
                                 {
                                   "--color-bg": `var(--color-${name})`,
                                 } as React.CSSProperties
                               } />
                          {chartConfig[name as keyof typeof chartConfig]?.label || name}
                          <div className="ml-auto flex flex-col items-end gap-0.5 font-mono font-medium tabular-nums text-foreground">
                            {isNormalized && originalValue !== undefined ? (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  Scaled: {typeof value === 'number' ? value.toFixed(1) : value}
                                </span>
                                <span>
                                  {originalValue.toLocaleString()}
                                </span>
                              </>
                            ) : (
                              <span>
                                {typeof value === 'number' ? value.toLocaleString() : value}
                              </span>
                            )}
                          </div>
                          {/* Add total row */}
                          {name === yAxisKey2 && (
                            <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                              Combined Total
                              <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                {isNormalized ? (
                                  <span className="text-xs">
                                    {((item.payload[`${yAxisKey1}_original`] || 0) + (item.payload[`${yAxisKey2}_original`] || 0)).toLocaleString()}
                                  </span>
                                ) : (
                                  item.payload.total.toLocaleString()
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey={yAxisKey1} stackId="a" fill="hsl(160 60% 45%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey={yAxisKey2} stackId="a" fill="hsl(220 70% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(160 60% 45%)" }}></div>
            <span>{chartConfig[yAxisKey1]?.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(220 70% 50%)" }}></div>
            <span>{chartConfig[yAxisKey2]?.label}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {insights.balance === 'balanced' ? (
            <>Well balanced distribution ({insights.ratio}) <TrendingUp className="h-4 w-4" /></>
          ) : insights.balance.includes('dominant') ? (
            <>{insights.balance.replace('_dominant', '').replace(/_/g, ' ')} leads ({insights.ratio1}%) <TrendingUp className="h-4 w-4" /></>
          ) : (
            <>Mixed distribution pattern <TrendingUp className="h-4 w-4" /></>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Total: {insights.totalSum.toLocaleString()} | {insights.trend === 'peaked' ? 'Peak values detected' : 'Consistent pattern'}
        </div>
      </CardFooter>
    </Card>
  )
} 