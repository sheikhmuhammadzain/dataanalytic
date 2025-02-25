import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { useDataStore } from '../store/dataStore';
import { mean, median, deviation, extent, quantile, bin } from 'd3-array';
import { 
  BarChart2, 
  LineChart, 
  PieChart, 
  Activity, 
  ScatterChart, 
  BoxPlot,
  ArrowUpDown,
  HelpCircle,
  Loader2,
  Search,
  Download,
  Grid2X2
} from 'lucide-react';
import { getChatCompletion } from '../services/gemini';
import { AIExplanationModal } from './AIExplanationModal';
import { saveAs } from "file-saver";

const COLORS = [
  '#6366f1', // indigo-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
];

interface ChartCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onExplain: () => void;
  isExplaining: boolean;
  isLoading?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  description, 
  icon, 
  children,
  onExplain,
  isExplaining,
  isLoading = false
}) => (
  <div className="flex flex-col h-full rounded-2xl border border-indigo-500/10 bg-white/5 backdrop-blur-lg">
    <div className="flex items-center justify-between p-6 border-b border-indigo-500/10">
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-white/90">{title}</h3>
        <p className="text-sm text-white/50 leading-tight">{description}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={onExplain}
            disabled={isExplaining || isLoading}
            className="group relative inline-block"
          >
         {isExplaining ? (
  <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
) : (
  <HelpCircle className="h-5 w-5 text-indigo-400/50 hover:text-indigo-400 transition-colors" />
)}
<div className="absolute left-full top-1/2 -translate-y-1/2 pl-2 pointer-events-none">
  <div className="bg-black/90 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-[1000]">
    Explain
  </div>
</div>

          </button>
        </div>
        <div className="flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
    <div className="flex-1 p-6 pt-4 overflow-hidden relative">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
            <p className="text-white/70 text-sm font-medium">Loading chart data...</p>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  </div>
);

const downsampleTimeSeries = (data: { x: Date; y: number }[], targetPoints: number = 1000) => {
  if (data.length <= targetPoints) return data;

  const step = Math.ceil(data.length / targetPoints);
  const downsampled = [];

  for (let i = 0; i < data.length; i += step) {
    const chunk = data.slice(i, Math.min(i + step, data.length));
    const avgY = chunk.reduce((sum, point) => sum + point.y, 0) / chunk.length;
    downsampled.push({
      x: chunk[0].x, // Keep the first timestamp in the chunk
      y: avgY,
    });
  }

  return downsampled;
};

const detectTimeColumn = (headers: string[], rows: any[]) => {
  const sampleSize = Math.min(100, rows.length);
  const dateScores = headers.map(header => {
    let dateCount = 0;
    for (let i = 0; i < sampleSize; i++) {
      const value = rows[i][header];
      if (!value) continue;
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        dateCount++;
      }
    }
    return { header, score: dateCount / sampleSize };
  });

  const bestMatch = dateScores.reduce((best, current) => 
    current.score > best.score ? current : best,
    { header: '', score: 0 }
  );

  return bestMatch.score > 0.8 ? bestMatch.header : null;
};

const prepareOptimizedCategoryData = (categoriesArray, countsArray, limit = 15) => {
  try {
    // Safety check for empty arrays
    if (!categoriesArray || !countsArray || categoriesArray.length === 0 || countsArray.length === 0) {
      console.log("Warning: Empty arrays passed to prepareOptimizedCategoryData");
      return { categories: ["No Data"], counts: [1] };
    }
    
    // Make a copy of the arrays to prevent mutating original data
    const categories = [...categoriesArray];
    const counts = [...countsArray];
    
    // Special case: if there's only "Unknown" or "Error" in categories
    if (categories.length === 1 && (categories[0] === "Unknown" || categories[0] === "Error" || categories[0] === "No Data")) {
      return { categories, counts };
    }
    
    // If we have fewer categories than the limit, return the original data
    if (categories.length <= limit) {
      return { categories, counts };
    }
    
    // Sort data by counts in descending order (if not already sorted)
    const combined = categories.map((cat, i) => ({ category: cat, count: counts[i] }));
    combined.sort((a, b) => b.count - a.count);
    
    // Take top categories up to the limit - 1 (leaving room for "Other")
    const topItems = combined.slice(0, limit - 1);
    const otherItems = combined.slice(limit - 1);
    
    // Calculate the sum of the "Other" category
    const otherSum = otherItems.reduce((sum, item) => sum + item.count, 0);
    
    // Prepare the final arrays
    const resultCategories = topItems.map(item => item.category);
    const resultCounts = topItems.map(item => item.count);
    
    // Only add "Other" if there's actually data to aggregate
    if (otherSum > 0) {
      resultCategories.push("Other");
      resultCounts.push(otherSum);
    }
    
    return {
      categories: resultCategories,
      counts: resultCounts
    };
  } catch (error) {
    console.error("Error in prepareOptimizedCategoryData:", error);
    return { categories: ["Error"], counts: [1] };
  }
};

interface DefaultVisualizationsProps {
  showFilters: boolean;
}

export const DefaultVisualizations: React.FC<DefaultVisualizationsProps> = ({ showFilters }) => {
  const processedData = useDataStore(state => state.processedData);
  const [selectedChart, setSelectedChart] = useState<string>('distribution');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedCategorical, setSelectedCategorical] = useState<string>("");
  const [explaining, setExplaining] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    distribution: true,
    boxplot: true,
    timeSeries: true,
    category: true,
    correlation: true,
    proportion: true,
    outlier: true
  });

  useEffect(() => {
    if (processedData?.summary?.numericalColumns.length) {
      setSelectedColumn(processedData.summary.numericalColumns[0]);
    }
    
    if (processedData?.summary?.categoricalColumns && processedData.summary.categoricalColumns.length > 0) {
      console.log("Setting initial selectedCategorical to:", processedData.summary.categoricalColumns[0]);
      setSelectedCategorical(processedData.summary.categoricalColumns[0]);
    }
  }, [processedData]);

  useEffect(() => {
    if (processedData) {
      setIsLoading({
        distribution: true,
        boxplot: true,
        timeSeries: true,
        category: true,
        correlation: true,
        proportion: true,
        outlier: true
      });
      
      // Let the chartData and categoryData useEffects handle clearing these states
      // However, add a safety timeout to ensure loading states are cleared even if something goes wrong
      const timer = setTimeout(() => {
        console.log("Safety timeout: forcing all loading states to false");
        setIsLoading({
          distribution: false,
          boxplot: false,
          timeSeries: false,
          category: false,
          correlation: false,
          proportion: false,
          outlier: false
        });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [processedData]);

  const handleExplain = async (chartType: string, data: any) => {
    setExplaining(prev => ({ ...prev, [chartType]: true }));
    let prompt = '';

    try {
      switch (chartType) {
        case 'distribution':
          prompt = `Analyze the distribution of "${data.column}". Please provide insights about:

1. The shape of the distribution (normal, skewed, etc.)
2. Key statistics (mean, median, standard deviation)
3. Any notable patterns or anomalies
4. Potential implications for the data analysis
5. Recommendations for further analysis`;
          break;

        case 'correlation':
          prompt = `Analyze the correlation between "${data.primaryColumn}" and "${data.secondaryColumn}". Please provide insights about:

1. The strength and direction of the correlation
2. The significance of the relationship
3. Any notable patterns or clusters
4. Potential causation factors to investigate
5. Recommendations for further analysis`;
          break;

        case 'outlier':
          prompt = `Analyze the box plot for outliers in "${data.primaryColumn}". Please provide insights about:

1. The overall spread of the data
2. The presence and significance of outliers
3. The symmetry of the distribution
4. Any unusual patterns
5. Practical implications of these outliers`;
          break;
        
        case 'category':
          prompt = `Analyze the categorical distribution for "${data.column}". Please provide insights about:

1. The most prominent categories and their significance
2. The balance or imbalance between categories
3. Any unusual patterns in the category distribution
4. Potential implications for further analysis
5. How this categorical distribution might impact other variables`;
          break;
        
        case 'proportion':
          prompt = `Analyze the proportional distribution for "${data.column}". Please provide insights about:

1. The relative sizes of each category segment
2. Any dominant categories and their business significance
3. The overall diversity of categories
4. How this distribution might impact decision-making
5. Recommendations for further investigation based on these proportions`;
          break;
      }

      let chunks = '';
      await getChatCompletion(
        prompt,
        `This is a data analysis task. The data being analyzed is from a CSV file with ${processedData?.summary.rowCount} rows and ${processedData?.summary.columnCount} columns.`,
        (chunk) => {
          chunks += chunk;
        }
      );

      setExplanation(chunks);
      setModalOpen(true);
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      setExplanation('Sorry, I encountered an error while analyzing this chart. Please try again.');
      setModalOpen(true);
    } finally {
      setExplaining(prev => ({ ...prev, [chartType]: false }));
    }
  };

  const defaultConfig = useMemo(() => ({
    displayModeBar: false,
    responsive: true,
  }), []);

  const defaultLayout = useMemo(() => ({
    font: { family: 'Inter, sans-serif', color: '#ffffff99' },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { t: 20, r: 10, b: 40, l: 60 },
    showlegend: true,
    legend: { font: { color: '#ffffff99' } },
    xaxis: {
      gridcolor: '#ffffff1a',
      zerolinecolor: '#ffffff33',
      tickfont: { color: '#ffffff99' },
    },
    yaxis: {
      gridcolor: '#ffffff1a',
      zerolinecolor: '#ffffff33',
      tickfont: { color: '#ffffff99' },
    },
    height: 300,
  }), []);

  const categoryData = useMemo(() => {
    if (!processedData?.rows || !selectedCategorical) {
      console.log("No processed data or categorical column selected");
      return null;
    }
    
    console.log("Generating categoryData for", selectedCategorical);
    
    try {
      // Create a more efficient aggregation process
      const counts: Record<string, number> = {};
      const maxCategoriesToProcess = 100; // Limit for very large datasets
      let totalProcessed = 0;
      
      // Process in batches for very large datasets
      const batchSize = 10000;
      const totalRows = processedData.rows.length;
      
      // Safely process rows
      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = processedData.rows.slice(i, Math.min(i + batchSize, totalRows));
        
        batch.forEach(row => {
          if (row && row[selectedCategorical] !== undefined) {
            const value = row[selectedCategorical];
            // Handle null, undefined, and empty strings
            const key = value != null && String(value).trim() !== "" 
              ? String(value).trim() 
              : "Unknown";
            
            counts[key] = (counts[key] || 0) + 1;
          }
        });
        
        totalProcessed += batch.length;
        console.log(`Processed ${totalProcessed} of ${totalRows} rows`);
      }
      
      // Ensure we have some data
      if (Object.keys(counts).length === 0) {
        console.log("No categories found in the data");
        return {
          categories: ["No Data"],
          counts: [0],
          percentages: [100],
          rawData: [["No Data", 0]],
          totalCount: 0
        };
      }
      
      // Sort and limit categories for visualization
      const sortedData = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxCategoriesToProcess);
      
      // Prepare data structure for visualization
      const categories = sortedData.map(([cat]) => cat);
      const categoryCounts = sortedData.map(([, count]) => count);
      
      // Calculate the total count of all categories
      const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
      
      // Calculate percentages for each category
      const percentages = categoryCounts.map(count => 
        totalCount > 0 ? (count / totalCount) * 100 : 0
      );
      
      console.log("Generated categories:", categories.length);
      
      return {
        categories,
        counts: categoryCounts,
        percentages,
        rawData: sortedData,
        totalCount
      };
    } catch (error) {
      console.error("Error generating category data:", error);
      // Return safe fallback
      return {
        categories: ["Error"],
        counts: [0],
        percentages: [100],
        rawData: [["Error", 0]],
        totalCount: 0
      };
    }
  }, [processedData, selectedCategorical]);

  useEffect(() => {
    console.log("categoryData updated:", categoryData ? "data available" : "no data");
  }, [categoryData]);

  useEffect(() => {
    if (categoryData) {
      console.log("Setting category loading states to false");
      setIsLoading(prev => ({ 
        ...prev, 
        category: false,
        proportion: false
      }));
      
      // For very large datasets, help garbage collection
      if (processedData?.rows && processedData.rows.length > 100000) {
        console.log("Large dataset detected - managing memory");
        // Force a small delay to ensure rendering completes
        const timer = setTimeout(() => {
          // This timeout helps ensure the UI has time to update
          // before any heavy operations continue
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [categoryData, processedData?.rows?.length]);

  useEffect(() => {
    if (isLoading.category || isLoading.proportion) {
      const timer = setTimeout(() => {
        console.log("Forcing category loading states to false via timeout");
        setIsLoading(prev => ({
          ...prev,
          category: false,
          proportion: false
        }));
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading.category, isLoading.proportion]);

  // Add this effect after the other chart data effects to handle edge cases for the pie chart
  useEffect(() => {
    // Special handling for proportional analysis issues
    const timer = setTimeout(() => {
      if (isLoading.proportion && categoryData) {
        console.log("Forcing proportion chart loading state to false due to timeout");
        setIsLoading(prev => ({
          ...prev,
          proportion: false
        }));
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isLoading.proportion, categoryData]);

  const chartData = useMemo(() => {
    if (!processedData?.rows?.length) return null;

    const numericColumns = processedData.summary.numericalColumns;
    if (numericColumns.length === 0) return null;

    const primaryColumn = numericColumns[0];
    const values = processedData.rows
      .map(row => Number(row[primaryColumn]))
      .filter(v => !isNaN(v));

    const stats = {
      mean: mean(values) || 0,
      median: median(values) || 0,
      q1: quantile(values, 0.25) || 0,
      q3: quantile(values, 0.75) || 0,
      stdDev: deviation(values) || 0,
    };

    const binGenerator = bin().domain(extent(values) as [number, number]).thresholds(20);
    const bins = binGenerator(values);
    const histogramData = bins.map(bin => ({
      x: (bin.x0! + bin.x1!) / 2,
      y: bin.length,
    }));

    const timeColumn = detectTimeColumn(processedData.headers, processedData.rows);
    const timeSeriesData = timeColumn ? 
      downsampleTimeSeries(
        processedData.rows
          .map(row => ({
            x: new Date(row[timeColumn]),
            y: Number(row[primaryColumn]),
          }))
          .filter(d => !isNaN(d.y) && !isNaN(d.x.getTime()))
          .sort((a, b) => a.x.getTime() - b.x.getTime())
      ) : null;

    const correlationData = numericColumns.length > 1 ? {
      x: processedData.rows.map(row => Number(row[numericColumns[0]])),
      y: processedData.rows.map(row => Number(row[numericColumns[1]])),
    } : null;

    return {
      primaryColumn,
      values,
      stats,
      histogramData,
      timeSeriesData,
      correlationData,
    };
  }, [processedData]);

  useEffect(() => {
    if (chartData) {
      setIsLoading(prev => ({
        ...prev,
        distribution: false,
        boxplot: false,
        outlier: false
      }));
      
      if (chartData.timeSeriesData) {
        setIsLoading(prev => ({ ...prev, timeSeries: false }));
      }
      
      if (chartData.correlationData) {
        setIsLoading(prev => ({ ...prev, correlation: false }));
      }
    }
  }, [chartData]);

  const filteredData = useMemo(() => {
    if (!processedData?.rows) return [];
    
    if (!filterValue.trim()) return processedData.rows;
    
    const searchTerms = filterValue.toLowerCase().split(' ').filter(Boolean);
    return processedData.rows.filter(row => 
      searchTerms.every(term => 
        Object.entries(row).some(([key, value]) => 
          value !== null && String(value).toLowerCase().includes(term)
        )
      )
    );
  }, [processedData?.rows, filterValue]);

  const handleDownloadCSV = useCallback(() => {
    if (!processedData?.headers || !filteredData.length) return;
    
    const headers = processedData.headers.join(',');
    
    const rows = filteredData.map(row => {
      return processedData.headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    }).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `data-export-${new Date().toISOString().split('T')[0]}.csv`);
  }, [processedData?.headers, filteredData]);

  if (!processedData || !chartData) return null;

  return (
    <div className="space-y-6">
      {!processedData ? (
        <div className="flex flex-col items-center justify-center h-[400px] bg-white/5 backdrop-blur-lg rounded-xl border border-indigo-500/10">
          <Loader2 className="h-12 w-12 text-indigo-400 animate-spin mb-4" />
          <p className="text-white/70 text-base font-medium">Loading visualization data...</p>
          <p className="text-white/50 text-sm mt-2">Please wait while we process your data</p>
        </div>
      ) : (
        <>
          {showFilters && (
            <>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">Chart Type</label>
                  <select
                    value={selectedChart}
                    onChange={(e) => setSelectedChart(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg text-white/90 px-4 py-2 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="distribution">Distribution Analysis</option>
                    <option value="timeSeries">Time Series</option>
                    <option value="correlation">Correlation Analysis</option>
                    <option value="categorical">Categorical Analysis</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">Column</label>
                  <select
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg text-white/90 px-4 py-2 focus:outline-none focus:border-indigo-500/50"
                  >
                    {processedData.summary.numericalColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                
                {processedData.summary.categoricalColumns && processedData.summary.categoricalColumns.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/90">Category Column</label>
                    <select
                      value={selectedCategorical}
                      onChange={(e) => setSelectedCategorical(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg text-white/90 px-4 py-2 focus:outline-none focus:border-indigo-500/50"
                    >
                      {processedData.summary.categoricalColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-grow space-y-2">
                  <label className="text-sm font-medium text-white/90">Filter Data</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                    <input
                      type="text"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder="Search in data..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg text-white/90 pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div className="text-xs text-white/50">
                    {filteredData.length} of {processedData?.rows?.length || 0} rows
                  </div>
                </div>
                
                <button
                  onClick={handleDownloadCSV}
                  disabled={!filteredData.length}
                  className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-white/90 px-4 py-2 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </button>
              </div>
            </>
          )}
          
          {!chartData ? (
            <div className="flex flex-col items-center justify-center h-[300px] bg-white/5 backdrop-blur-lg rounded-xl border border-indigo-500/10 mt-6">
              <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mb-3" />
              <p className="text-white/70 text-sm">Preparing visualization charts...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
              <ChartCard
                title="Distribution Analysis"
                description="Statistical distribution and density"
                icon={<Activity className="h-5 w-5 text-indigo-400" />}
                onExplain={() => handleExplain('distribution', chartData)}
                isExplaining={explaining['distribution']}
                isLoading={isLoading['distribution']}
              >
                <Plot
                  data={[{
                    type: 'violin',
                    x: chartData.values,
                    name: chartData.primaryColumn,
                    box: { visible: true },
                    meanline: { visible: true },
                    line: { color: COLORS[0] },
                  }]}
                  layout={{ ...defaultLayout }}
                  config={defaultConfig}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler
                />
              </ChartCard>

              <ChartCard
                title="Time Series Analysis"
                description="Trends over time"
                icon={<LineChart className="h-5 w-5 text-indigo-400" />}
                onExplain={() => handleExplain('timeSeries', chartData)}
                isExplaining={explaining['timeSeries']}
                isLoading={isLoading['timeSeries']}
              >
                {chartData.timeSeriesData ? (
                  <Plot
                    data={[{
                      type: 'scatter',
                      mode: 'lines',
                      x: chartData.timeSeriesData.map(d => d.x),
                      y: chartData.timeSeriesData.map(d => d.y),
                      line: { 
                        color: COLORS[1],
                        shape: 'spline',
                        smoothing: 0.3,
                      }
                    }]}
                    layout={{
                      ...defaultLayout,
                      xaxis: {
                        ...defaultLayout.xaxis,
                        type: 'date',
                        tickformat: '%Y-%m-%d',
                        nticks: 10
                      }
                    }}
                    config={{
                      ...defaultConfig,
                      displayModeBar: true,
                      modeBarButtonsToAdd: ['zoom2d', 'pan2d', 'resetScale2d']
                    }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-white/50">
                    No time series data available
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title={`Category Distribution: ${selectedCategorical}`}
                description="Hierarchical view of categories"
                icon={<Grid2X2 className="h-5 w-5 text-indigo-400" />}
                onExplain={() => handleExplain('category', { column: selectedCategorical })}
                isExplaining={explaining['category']}
                isLoading={isLoading['category']}
              >
                {!categoryData ? (
                  <div className="h-[300px] flex items-center justify-center text-white/50">
                    No categorical data available
                  </div>
                ) : (
                  <Plot
                    data={[{
                      type: 'treemap',
                      labels: (() => {
                        const optimized = prepareOptimizedCategoryData(categoryData.categories, categoryData.counts);
                        return optimized.categories;
                      })(),
                      parents: Array((() => {
                        const optimized = prepareOptimizedCategoryData(categoryData.categories, categoryData.counts);
                        return optimized.categories.length;
                      })()).fill(''),
                      values: (() => {
                        const optimized = prepareOptimizedCategoryData(categoryData.categories, categoryData.counts);
                        return optimized.counts;
                      })(),
                      hovertemplate: '<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percentRoot:.1f}%<extra></extra>',
                      texttemplate: '<b>%{label}</b><br>%{percentRoot:.1f}%',
                      branchvalues: 'total',
                      marker: {
                        colors: (() => {
                          const optimized = prepareOptimizedCategoryData(categoryData.categories, categoryData.counts);
                          return optimized.categories.map((_, i) => COLORS[i % COLORS.length]);
                        })(),
                        line: { width: 1, color: 'rgba(255,255,255,0.2)' }
                      },
                      textinfo: 'label+value',
                      textposition: 'middle',
                      hoverlabel: {
                        bgcolor: '#262626',
                        bordercolor: '#404040',
                        font: { color: 'white' }
                      }
                    }]}
                    layout={{
                      ...defaultLayout,
                      margin: { t: 30, r: 10, b: 10, l: 10 },
                    }}
                    config={defaultConfig}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                )}
              </ChartCard>

              <ChartCard
                title="Correlation Analysis"
                description="Relationship between variables"
                icon={<ScatterChart className="h-5 w-5 text-indigo-400" />}
                onExplain={() => handleExplain('correlation', chartData)}
                isExplaining={explaining['correlation']}
                isLoading={isLoading['correlation']}
              >
                {chartData.correlationData ? (
                  <Plot
                    data={[{
                      type: 'scatter',
                      mode: 'markers',
                      x: chartData.correlationData.x,
                      y: chartData.correlationData.y,
                      marker: { color: COLORS[3] },
                    }]}
                    layout={{ ...defaultLayout }}
                    config={defaultConfig}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-white/50">
                    Insufficient numerical columns for correlation
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title={`Proportional Analysis: ${selectedCategorical}`}
                description="Distribution across categories"
                icon={<PieChart className="h-5 w-5 text-indigo-400" />}
                onExplain={() => handleExplain('proportion', { column: selectedCategorical })}
                isExplaining={explaining['proportion']}
                isLoading={isLoading['proportion']}
              >
                {!categoryData || categoryData.categories.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-white/50">
                    No categorical data available
                  </div>
                ) : categoryData.categories.length === 1 && categoryData.categories[0] === "No Data" ? (
                  <div className="h-[300px] flex items-center justify-center text-white/50">
                    No valid categories found in this column
                  </div>
                ) : (
                  <Plot
                    data={[{
                      type: 'pie',
                      labels: (() => {
                        try {
                          if (!categoryData) return ["No Data"];
                          const optimized = prepareOptimizedCategoryData(categoryData.categories, categoryData.counts, 6); // Reduced to 6 for better visualization
                          return optimized.categories;
                        } catch (error) {
                          console.error("Error preparing pie chart labels:", error);
                          return ["Error loading data"];
                        }
                      })(),
                      values: (() => {
                        try {
                          if (!categoryData) return [1];
                          const optimized = prepareOptimizedCategoryData(categoryData.categories, categoryData.counts, 6);
                          return optimized.counts;
                        } catch (error) {
                          console.error("Error preparing pie chart values:", error);
                          return [1];
                        }
                      })(),
                      textinfo: 'label+percent',
                      insidetextorientation: 'horizontal',
                      textposition: 'inside',
                      automargin: true,
                      marker: {
                        colors: (() => {
                          try {
                            if (!categoryData) return [COLORS[0]];
                            const optimized = prepareOptimizedCategoryData(categoryData.categories, categoryData.counts, 6);
                            return optimized.categories.map((_, i) => COLORS[i % COLORS.length]);
                          } catch (error) {
                            console.error("Error preparing pie chart colors:", error);
                            return [COLORS[0]];
                          }
                        })(),
                        line: { width: 1, color: 'rgba(255,255,255,0.2)' }
                      },
                      hoverlabel: {
                        bgcolor: '#262626',
                        bordercolor: '#404040',
                        font: { color: 'white' }
                      },
                      hovertemplate: '<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>',
                      hole: 0.3,
                      pull: [0.03, 0.03, 0.03, 0.03, 0.03, 0.03], // slight pull on all slices
                    }]}
                    layout={{ 
                      ...defaultLayout,
                      margin: { t: 30, r: 20, b: 20, l: 20 },
                      showlegend: true,
                      legend: {
                        orientation: 'h',
                        yanchor: 'bottom',
                        y: -0.3,
                        xanchor: 'center',
                        x: 0.5
                      }
                    }}
                    config={defaultConfig}
                    style={{ width: '100%', height: '300px' }}
                    useResizeHandler
                  />
                )}
              </ChartCard>

              <ChartCard
                title="Outlier Detection"
                description="Identify anomalies in data"
                icon={<ArrowUpDown className="h-5 w-5 text-indigo-400" />}
                onExplain={() => handleExplain('outlier', chartData)}
                isExplaining={explaining['outlier']}
                isLoading={isLoading['outlier']}
              >
                <Plot
                  data={[{
                    type: 'box',
                    y: chartData.values,
                    name: chartData.primaryColumn,
                    boxpoints: 'outliers',
                    marker: { color: COLORS[5] },
                  }]}
                  layout={{ ...defaultLayout }}
                  config={defaultConfig}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler
                />
              </ChartCard>
            </div>
          )}
          
          <AIExplanationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            content={explanation}
          />
        </>
      )}
    </div>
  );
};
