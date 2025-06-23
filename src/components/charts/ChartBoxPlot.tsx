"use client"

import { TrendingUp } from "lucide-react"
import { Box } from "@visx/stats"
import { Group } from "@visx/group"
import { scaleBand, scaleLinear } from "@visx/scale"
import { useMemo, useRef, useEffect, useState } from "react"
import { useDataStore } from "../../store/dataStore"
import { ChartExplanation } from "../ChartExplanation"
import { quantile, extent } from "d3-array"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"

export const description = "A box plot showing distribution by category"

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

// Responsive Box plot component
const ResponsiveBoxPlot = ({ data, margin = { top: 20, right: 30, bottom: 80, left: 80 } }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Handle responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const height = 400; // Fixed height for better UX
        
        // Ensure minimum width for readability
        const width = Math.max(containerWidth, 320);
        
        setDimensions({ width, height });
      }
    };

    // Initial sizing
    updateDimensions();

    // Add resize listener
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => resizeObserver.disconnect();
  }, [data]);

  const { width, height } = dimensions;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.bottom - margin.top;

  // Create scales with responsive considerations
  const xScale = scaleBand({
    range: [0, innerWidth],
    domain: data.map((d: any) => d.category),
    padding: Math.min(0.3, Math.max(0.1, 0.3 - (data.length - 3) * 0.02)), // Dynamic padding
  });

  const yScale = scaleLinear({
    range: [innerHeight, 0],
    domain: extent(data.flatMap((d: any) => [d.min, d.max])) as [number, number],
  });

  const boxWidth = xScale.bandwidth();
  
  // Responsive font sizes
  const fontSize = Math.max(10, Math.min(12, width / 80));
  const axisFontSize = Math.max(8, Math.min(11, width / 100));

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px]">
      <svg width={width} height={height} className="overflow-visible">
        <Group left={margin.left} top={margin.top}>
          {data.map((d: any, i: number) => {
            const x = xScale(d.category) || 0;
            const boxHeight = Math.abs(yScale(d.q1) - yScale(d.q3));
            const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#3b82f6'];
            const color = colors[i % colors.length];

            return (
              <Group key={d.category}>
                {/* Whiskers */}
                <line
                  x1={x + boxWidth / 2}
                  x2={x + boxWidth / 2}
                  y1={yScale(d.min)}
                  y2={yScale(d.q1)}
                  stroke={color}
                  strokeWidth={Math.max(1, boxWidth / 40)}
                />
                <line
                  x1={x + boxWidth / 2}
                  x2={x + boxWidth / 2}
                  y1={yScale(d.q3)}
                  y2={yScale(d.max)}
                  stroke={color}
                  strokeWidth={Math.max(1, boxWidth / 40)}
                />
                
                {/* Whisker caps */}
                <line
                  x1={x + boxWidth * 0.25}
                  x2={x + boxWidth * 0.75}
                  y1={yScale(d.min)}
                  y2={yScale(d.min)}
                  stroke={color}
                  strokeWidth={Math.max(1, boxWidth / 40)}
                />
                <line
                  x1={x + boxWidth * 0.25}
                  x2={x + boxWidth * 0.75}
                  y1={yScale(d.max)}
                  y2={yScale(d.max)}
                  stroke={color}
                  strokeWidth={Math.max(1, boxWidth / 40)}
                />
                
                {/* Box */}
                <rect
                  x={x}
                  y={yScale(d.q3)}
                  width={boxWidth}
                  height={boxHeight}
                  fill={color}
                  fillOpacity={0.6}
                  stroke={color}
                  strokeWidth={Math.max(1, boxWidth / 30)}
                />
                
                {/* Median line */}
                <line
                  x1={x}
                  x2={x + boxWidth}
                  y1={yScale(d.median)}
                  y2={yScale(d.median)}
                  stroke="#1f2937"
                  strokeWidth={Math.max(2, boxWidth / 25)}
                />
                
                {/* Outliers */}
                {d.outliers?.map((outlier: number, idx: number) => (
                  <circle
                    key={idx}
                    cx={x + boxWidth / 2}
                    cy={yScale(outlier)}
                    r={Math.max(2, Math.min(4, boxWidth / 20))}
                    fill={color}
                    fillOpacity={0.8}
                  />
                ))}
              </Group>
            );
          })}
          
          {/* Y-axis */}
          <line
            x1={0}
            x2={0}
            y1={0}
            y2={innerHeight}
            stroke="#6b7280"
            strokeWidth={1}
          />
          
          {/* X-axis */}
          <line
            x1={0}
            x2={innerWidth}
            y1={innerHeight}
            y2={innerHeight}
            stroke="#6b7280"
            strokeWidth={1}
          />
          
          {/* Y-axis ticks and labels */}
          {yScale.ticks(5).map(tick => (
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
                fontSize={axisFontSize}
                fill="#6b7280"
              >
                {formatNumber(tick)}
              </text>
            </Group>
          ))}
          
          {/* X-axis labels with responsive text wrapping */}
          {data.map((d: any) => {
            const x = (xScale(d.category) || 0) + boxWidth / 2;
            const maxLabelLength = Math.max(6, Math.floor(boxWidth / 6));
            const label = d.category.length > maxLabelLength 
              ? d.category.substring(0, maxLabelLength) + '...' 
              : d.category;
            
            return (
              <text
                key={d.category}
                x={x}
                y={innerHeight + 20}
                textAnchor="middle"
                fontSize={axisFontSize}
                fill="#6b7280"
                transform={width < 600 ? `rotate(-45, ${x}, ${innerHeight + 20})` : undefined}
              >
                {label}
              </text>
            );
          })}
        </Group>
        
        {/* Responsive axis labels */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#374151"
          fontWeight="500"
        >
          Category
        </text>
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#374151"
          fontWeight="500"
          transform={`rotate(-90, 20, ${height / 2})`}
        >
          Value
        </text>
      </svg>
    </div>
  );
};

export function ChartBoxPlot() {
  const processedData = useDataStore(state => state.processedData);

  // Prepare box plot data from CSV
  const { boxPlotData, categoryKey, valueKey, noData } = useMemo(() => {
    if (!processedData?.rows || processedData.rows.length === 0) {
      return {
        boxPlotData: [],
        categoryKey: '',
        valueKey: '',
        noData: true
      };
    }

    const { headers, summary } = processedData;
    
    // We need at least one categorical and one numerical column
    if (summary.categoricalColumns.length === 0 || summary.numericalColumns.length === 0) {
      return {
        boxPlotData: [],
        categoryKey: '',
        valueKey: '',
        noData: true
      };
    }

    // Use first categorical column as categories
    let categoryColumn = summary.categoricalColumns[0];
    // Use first numerical column as values
    let valueColumn = summary.numericalColumns[0];

    // Look for price-like column
    const priceColumn = summary.numericalColumns.find(col => 
      col.toLowerCase().includes('price') || 
      col.toLowerCase().includes('cost') ||
      col.toLowerCase().includes('amount') ||
      col.toLowerCase().includes('value')
    );
    if (priceColumn) {
      valueColumn = priceColumn;
    }

    // Look for category-like column
    const categoryLikeColumn = summary.categoricalColumns.find(col => 
      col.toLowerCase().includes('category') || 
      col.toLowerCase().includes('type') ||
      col.toLowerCase().includes('group') ||
      col.toLowerCase().includes('class')
    );
    if (categoryLikeColumn) {
      categoryColumn = categoryLikeColumn;
    }

    // Group data by category
    const groupedData = new Map<string, number[]>();
    
    processedData.rows.forEach(row => {
      const category = String(row[categoryColumn] || 'Unknown');
      const value = Number(row[valueColumn]);
      
      if (!isNaN(value)) {
        if (!groupedData.has(category)) {
          groupedData.set(category, []);
        }
        groupedData.get(category)!.push(value);
      }
    });

    // Calculate box plot statistics for each category
    const boxPlotData = Array.from(groupedData.entries()).map(([category, values]) => {
      const sortedValues = values.sort((a, b) => a - b);
      const q1 = quantile(sortedValues, 0.25) || 0;
      const q3 = quantile(sortedValues, 0.75) || 0;
      const median = quantile(sortedValues, 0.5) || 0;
      const iqr = q3 - q1;
      
      // Calculate whiskers
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;
      
      const min = Math.max(Math.min(...sortedValues), lowerFence);
      const max = Math.min(Math.max(...sortedValues), upperFence);
      
      // Find outliers
      const outliers = sortedValues.filter(v => v < lowerFence || v > upperFence);

      return {
        category,
        min,
        max,
        q1,
        q3,
        median,
        outliers,
        count: values.length
      };
    }).slice(0, 8); // Allow more categories on full width

    return {
      boxPlotData,
      categoryKey: categoryColumn,
      valueKey: valueColumn,
      noData: false
    };
  }, [processedData]);

  if (noData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Price Distribution by Category</CardTitle>
          <CardDescription>
            Upload CSV data to visualize price distributions across categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>No data available. Please upload a CSV file with categorical and numerical data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate insights
  const insights = useMemo(() => {
    if (boxPlotData.length === 0) return null;
    
    const highestMedian = boxPlotData.reduce((prev, current) => 
      current.median > prev.median ? current : prev
    );
    
    const lowestMedian = boxPlotData.reduce((prev, current) => 
      current.median < prev.median ? current : prev
    );
    
    return { highestMedian, lowestMedian };
  }, [boxPlotData]);

  return (
    <Card className="w-full">
      <ChartExplanation
        chartType="Box Plot"
        dataKeys={{ categoryKey, valueKey }}
        chartData={boxPlotData}
        insights={insights}
      />
      <CardHeader>
        <CardTitle>{valueKey.replace(/_/g, ' ')} Distribution by {categoryKey.replace(/_/g, ' ')}</CardTitle>
        <CardDescription>
          Statistical distribution showing quartiles, median, and outliers across categories
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full">
          <ResponsiveBoxPlot data={boxPlotData} />
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex w-full items-start gap-2">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {insights && (
                <>
                  Highest median: {insights.highestMedian.category} ({formatNumber(insights.highestMedian.median)})
                  <TrendingUp className="h-4 w-4" />
                </>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              {insights && `Lowest median: ${insights.lowestMedian.category} (${formatNumber(insights.lowestMedian.median)})`}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
} 