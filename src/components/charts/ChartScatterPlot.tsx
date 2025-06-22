"use client"

import { TrendingUp } from "lucide-react"
import { Group } from "@visx/group"
import { scaleLinear, scaleOrdinal } from "@visx/scale"
import { useMemo } from "react"
import { useDataStore } from "../../store/dataStore"
import { ChartExplanation } from "../ChartExplanation"
import { extent, max, min } from "d3-array"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"

export const description = "A scatter plot showing relationships between numerical variables"

// Utility function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else if (num >= 1) {
    return num.toLocaleString();
  } else {
    return num.toFixed(2);
  }
};

// Color palette for different categories
const COLORS = [
  '#2563eb', // Blue - East
  '#dc2626', // Red - South  
  '#16a34a', // Green - North
  '#ca8a04', // Yellow - Central
  '#7c3aed', // Purple - West
  '#db2777', // Pink
  '#059669', // Emerald
  '#0891b2', // Cyan
];

// Scatter plot component
const ScatterPlot = ({ data, width, height, margin = { top: 20, right: 150, bottom: 60, left: 80 } }: any) => {
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.bottom - margin.top

  // Create scales
  const xScale = scaleLinear({
    range: [0, innerWidth],
    domain: extent(data, (d: any) => d.x) as [number, number],
  })

  const yScale = scaleLinear({
    range: [innerHeight, 0],
    domain: extent(data, (d: any) => d.y) as [number, number],
  })

  const colorScale = scaleOrdinal({
    domain: [...new Set(data.map((d: any) => d.category))],
    range: COLORS,
  })

  // Calculate size scale for quality/rating
  const sizeExtent = extent(data, (d: any) => d.size) as [number, number]
  const sizeScale = scaleLinear({
    domain: sizeExtent,
    range: [4, 12], // Min and max radius
  })

  const categories = [...new Set(data.map((d: any) => d.category))]
  const uniqueSizes = [...new Set(data.map((d: any) => d.size))].sort((a, b) => a - b)

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        {/* Grid lines */}
        {xScale.ticks(8).map(tick => (
          <line
            key={`x-grid-${tick}`}
            x1={xScale(tick)}
            x2={xScale(tick)}
            y1={0}
            y2={innerHeight}
            stroke="#f3f4f6"
            strokeWidth={1}
          />
        ))}
        {yScale.ticks(6).map(tick => (
          <line
            key={`y-grid-${tick}`}
            x1={0}
            x2={innerWidth}
            y1={yScale(tick)}
            y2={yScale(tick)}
            stroke="#f3f4f6"
            strokeWidth={1}
          />
        ))}

        {/* Data points */}
        {data.map((d: any, i: number) => (
          <circle
            key={i}
            cx={xScale(d.x)}
            cy={yScale(d.y)}
            r={sizeScale(d.size)}
            fill={colorScale(d.category)}
            fillOpacity={0.7}
            stroke={colorScale(d.category)}
            strokeWidth={1}
            style={{ cursor: 'pointer' }}
          />
        ))}
        
        {/* X-axis */}
        <line
          x1={0}
          x2={innerWidth}
          y1={innerHeight}
          y2={innerHeight}
          stroke="#6b7280"
          strokeWidth={2}
        />
        
        {/* Y-axis */}
        <line
          x1={0}
          x2={0}
          y1={0}
          y2={innerHeight}
          stroke="#6b7280"
          strokeWidth={2}
        />
        
        {/* X-axis ticks and labels */}
        {xScale.ticks(8).map(tick => (
          <Group key={tick}>
            <line
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={innerHeight}
              y2={innerHeight + 5}
              stroke="#6b7280"
              strokeWidth={1}
            />
            <text
              x={xScale(tick)}
              y={innerHeight + 18}
              textAnchor="middle"
              fontSize={12}
              fill="#6b7280"
            >
              {formatNumber(tick)}
            </text>
          </Group>
        ))}
        
        {/* Y-axis ticks and labels */}
        {yScale.ticks(6).map(tick => (
          <Group key={tick}>
            <line
              x1={-5}
              x2={0}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="#6b7280"
              strokeWidth={1}
            />
            <text
              x={-10}
              y={yScale(tick)}
              dy="0.32em"
              textAnchor="end"
              fontSize={12}
              fill="#6b7280"
            >
              {formatNumber(tick)}
            </text>
          </Group>
        ))}
      </Group>
      
      {/* Legend for categories */}
      <Group left={width - margin.right + 20} top={margin.top + 20}>
        <text
          x={0}
          y={0}
          fontSize={14}
          fill="#374151"
          fontWeight="600"
        >
          Category
        </text>
        {categories.map((category, i) => (
          <Group key={category} top={20 + i * 25}>
            <circle
              cx={10}
              cy={0}
              r={6}
              fill={colorScale(category)}
              fillOpacity={0.7}
              stroke={colorScale(category)}
              strokeWidth={1}
            />
            <text
              x={25}
              y={0}
              dy="0.32em"
              fontSize={12}
              fill="#374151"
            >
              {category}
            </text>
          </Group>
        ))}
      </Group>

      {/* Legend for sizes */}
      <Group left={width - margin.right + 20} top={margin.top + 20 + categories.length * 25 + 40}>
        <text
          x={0}
          y={0}
          fontSize={14}
          fill="#374151"
          fontWeight="600"
        >
          Rating
        </text>
        {uniqueSizes.slice(0, 5).map((size, i) => (
          <Group key={size} top={20 + i * 25}>
            <circle
              cx={10}
              cy={0}
              r={sizeScale(size)}
              fill="#6b7280"
              fillOpacity={0.5}
              stroke="#6b7280"
              strokeWidth={1}
            />
            <text
              x={25}
              y={0}
              dy="0.32em"
              fontSize={12}
              fill="#374151"
            >
              {size.toFixed(1)}
            </text>
          </Group>
        ))}
      </Group>
      
      {/* Axis labels */}
      <text
        x={width / 2}
        y={height - 5}
        textAnchor="middle"
        fontSize={14}
        fill="#374151"
        fontWeight="500"
      >
        X Variable
      </text>
      <text
        x={20}
        y={height / 2}
        textAnchor="middle"
        fontSize={14}
        fill="#374151"
        fontWeight="500"
        transform={`rotate(-90, 20, ${height / 2})`}
      >
        Y Variable
      </text>
    </svg>
  )
}

export function ChartScatterPlot() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare scatter plot data from CSV
  const { scatterData, xKey, yKey, categoryKey, sizeKey, noData } = useMemo(() => {
    if (!processedData?.rows || processedData.rows.length === 0) {
      return {
        scatterData: [],
        xKey: '',
        yKey: '',
        categoryKey: '',
        sizeKey: '',
        noData: true
      };
    }

    const { headers, summary } = processedData;
    
    // We need at least 2 numerical columns and 1 categorical column
    if (summary.numericalColumns.length < 2 || summary.categoricalColumns.length === 0) {
      return {
        scatterData: [],
        xKey: '',
        yKey: '',
        categoryKey: '',
        sizeKey: '',
        noData: true
      };
    }

    // Smart column selection
    let xColumn = summary.numericalColumns[0];
    let yColumn = summary.numericalColumns[1];
    let categoryColumn = summary.categoricalColumns[0];
    let sizeColumn = summary.numericalColumns[2] || summary.numericalColumns[0];

    // Look for price-like column for X-axis
    const priceColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('price') || 
      col.toLowerCase().includes('cost') ||
      col.toLowerCase().includes('amount')
    );
    if (priceColumn) {
      xColumn = priceColumn;
    }

    // Look for sales/volume column for Y-axis
    const salesColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('sales') || 
      col.toLowerCase().includes('volume') ||
      col.toLowerCase().includes('quantity') ||
      col.toLowerCase().includes('units')
    );
    if (salesColumn && salesColumn !== xColumn) {
      yColumn = salesColumn;
    }

    // Look for region/location column
    const regionColumn = summary.categoricalColumns.find(col => 
      col.toLowerCase().includes('region') || 
      col.toLowerCase().includes('location') ||
      col.toLowerCase().includes('area') ||
      col.toLowerCase().includes('zone')
    );
    if (regionColumn) {
      categoryColumn = regionColumn;
    }

    // Look for rating/quality column for size
    const ratingColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('rating') || 
      col.toLowerCase().includes('quality') ||
      col.toLowerCase().includes('score') ||
      col.toLowerCase().includes('grade')
    );
    if (ratingColumn && ratingColumn !== xColumn && ratingColumn !== yColumn) {
      sizeColumn = ratingColumn;
    }

    // Prepare scatter plot data
    const scatterData = processedData.rows
      .map(row => ({
        x: Number(row[xColumn]),
        y: Number(row[yColumn]),
        category: String(row[categoryColumn] || 'Unknown'),
        size: Number(row[sizeColumn]) || 1,
      }))
      .filter(d => !isNaN(d.x) && !isNaN(d.y) && d.size > 0)
      .slice(0, 200); // Limit for performance

    return {
      scatterData,
      xKey: xColumn,
      yKey: yColumn,
      categoryKey: categoryColumn,
      sizeKey: sizeColumn,
      noData: false
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales vs. Price Relationship</CardTitle>
          <CardDescription>
            Upload CSV data to visualize relationships between numerical variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>No data available. Please upload a CSV file with at least 2 numerical and 1 categorical column.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate insights
  const insights = useMemo(() => {
    if (scatterData.length === 0) return null;
    
    // Simple correlation calculation
    const xValues = scatterData.map(d => d.x);
    const yValues = scatterData.map(d => d.y);
    const n = xValues.length;
    
    const meanX = xValues.reduce((a, b) => a + b, 0) / n;
    const meanY = yValues.reduce((a, b) => a + b, 0) / n;
    
    const numerator = xValues.reduce((sum, x, i) => sum + (x - meanX) * (yValues[i] - meanY), 0);
    const denomX = Math.sqrt(xValues.reduce((sum, x) => sum + (x - meanX) ** 2, 0));
    const denomY = Math.sqrt(yValues.reduce((sum, y) => sum + (y - meanY) ** 2, 0));
    
    const correlation = numerator / (denomX * denomY);
    
    const categoryCounts = scatterData.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    return { correlation, topCategory, totalPoints: scatterData.length };
  }, [scatterData]);

  return (
    <Card className="relative">
      <ChartExplanation
        chartType="Scatter Plot"
        dataKeys={{ xKey, yKey, categoryKey, sizeKey }}
        chartData={scatterData}
        insights={insights}
      />
      <CardHeader>
        <CardTitle>{yKey.replace(/_/g, ' ')} vs. {xKey.replace(/_/g, ' ')} (colored by {categoryKey.replace(/_/g, ' ')})</CardTitle>
        <CardDescription>
          Relationship between variables with categorical grouping and {sizeKey.replace(/_/g, ' ')} represented by point size
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96 overflow-x-auto">
          <ScatterPlot 
            data={scatterData} 
            width={Math.max(900, scatterData.length * 2)} 
            height={384}
          />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {insights && (
                <>
                  Correlation: {insights.correlation.toFixed(3)} | Top category: {insights.topCategory}
                  <TrendingUp className="h-4 w-4" />
                </>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              {insights && `${insights.totalPoints} data points visualized`}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
} 