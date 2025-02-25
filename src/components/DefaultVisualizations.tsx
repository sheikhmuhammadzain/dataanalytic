import React, { useMemo, useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { getChatCompletion } from '../services/groq';
import { AIExplanationModal } from './AIExplanationModal';

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
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  description, 
  icon, 
  children,
  onExplain,
  isExplaining
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
            disabled={isExplaining}
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
    <div className="flex-1 p-6 pt-4 overflow-hidden">
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

interface DefaultVisualizationsProps {
  showFilters: boolean;
}

export const DefaultVisualizations: React.FC<DefaultVisualizationsProps> = ({ showFilters }) => {
  const processedData = useDataStore(state => state.processedData);
  const [selectedChart, setSelectedChart] = useState<string>('distribution');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [explaining, setExplaining] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    if (processedData?.summary?.numericalColumns.length) {
      setSelectedColumn(processedData.summary.numericalColumns[0]);
    }
  }, [processedData]);

  const handleExplain = async (chartType: string, data: any) => {
    setExplaining(prev => ({ ...prev, [chartType]: true }));
    
    try {
      let prompt = '';
      switch (chartType) {
        case 'distribution':
          prompt = `Analyze this distribution data for the column "${data.primaryColumn}". Key statistics:

**Mean**: ${data.stats.mean.toFixed(2)}
**Median**: ${data.stats.median.toFixed(2)}
**Standard Deviation**: ${data.stats.stdDev.toFixed(2)}

Please provide insights about:
1. The shape of the distribution
2. Any skewness or unusual patterns
3. The spread of the data
4. Practical implications of these statistics`;
          break;
        case 'timeSeries':
          prompt = `Analyze the time series trend for "${data.primaryColumn}". Please provide insights about:

1. Overall trend direction
2. Any seasonal patterns
3. Notable peaks or valleys
4. Rate of change
5. Any anomalies or unusual patterns`;
          break;
        case 'category':
          prompt = `Analyze the category distribution shown in the bar chart. Please provide insights about:

1. The most frequent categories
2. Distribution patterns
3. Any notable imbalances
4. Potential implications of this distribution`;
          break;
        case 'correlation':
          prompt = `Analyze the correlation between the variables shown in the scatter plot. Please provide insights about:

1. The type of relationship (positive, negative, or none)
2. The strength of the relationship
3. Any notable patterns or clusters
4. Potential outliers
5. Practical implications of this relationship`;
          break;
        case 'proportion':
          prompt = `Analyze the proportional distribution shown in the pie chart. Please provide insights about:

1. Dominant segments
2. Balance between categories
3. Any notable patterns
4. Business or practical implications`;
          break;
        case 'outlier':
          prompt = `Analyze the box plot for outliers in "${data.primaryColumn}". Please provide insights about:

1. The overall spread of the data
2. The presence and significance of outliers
3. The symmetry of the distribution
4. Any unusual patterns
5. Practical implications of these outliers`;
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

  const chartData = useMemo(() => {
    if (!processedData?.rows?.length) return null;

    const numericColumns = processedData.summary.numericalColumns;
    if (numericColumns.length === 0) return null;

    const primaryColumn = numericColumns[0];
    const values = processedData.rows
      .map(row => Number(row[primaryColumn]))
      .filter(v => !isNaN(v));

    // Calculate basic statistics
    const stats = {
      mean: mean(values) || 0,
      median: median(values) || 0,
      q1: quantile(values, 0.25) || 0,
      q3: quantile(values, 0.75) || 0,
      stdDev: deviation(values) || 0,
    };

    // Create histogram bins
    const binGenerator = bin().domain(extent(values) as [number, number]).thresholds(20);
    const bins = binGenerator(values);
    const histogramData = bins.map(bin => ({
      x: (bin.x0! + bin.x1!) / 2,
      y: bin.length,
    }));

    // Improved time series detection and processing
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

    // Improved category data processing
    const categoryColumn = processedData.summary.categoricalColumns[0];
    const categoryData = categoryColumn ? 
      Object.entries(
        processedData.rows.reduce((acc, row) => {
          const cat = String(row[categoryColumn] || 'Unknown');
          if (!acc[cat]) acc[cat] = 0;
          acc[cat]++;
          return acc;
        }, {} as Record<string, number>)
      )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    : null;

    // Correlation data
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
      categoryData,
      correlationData,
    };
  }, [processedData]);

  if (!chartData) return null;

  return (
    <div className="space-y-6">
      {showFilters && (
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
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
        {/* Distribution Analysis */}
        <ChartCard
          title="Distribution Analysis"
          description="Statistical distribution and density"
          icon={<Activity className="h-5 w-5 text-indigo-400" />}
          onExplain={() => handleExplain('distribution', chartData)}
          isExplaining={explaining['distribution']}
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

        {/* Time Series Analysis */}
        <ChartCard
          title="Time Series Analysis"
          description="Trends over time"
          icon={<LineChart className="h-5 w-5 text-indigo-400" />}
          onExplain={() => handleExplain('timeSeries', chartData)}
          isExplaining={explaining['timeSeries']}
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

        {/* Category Comparison */}
        <ChartCard
          title="Category Comparison"
          description="Distribution of categories"
          icon={<BarChart2 className="h-5 w-5 text-indigo-400" />}
          onExplain={() => handleExplain('category', chartData)}
          isExplaining={explaining['category']}
        >
          {chartData.categoryData ? (
            <Plot
              data={[{
                type: 'bar',
                x: chartData.categoryData.map(([cat]) => cat),
                y: chartData.categoryData.map(([, count]) => count),
                marker: { color: COLORS[2] },
                text: chartData.categoryData.map(([, count]) => count),
                textposition: 'auto',
              }]}
              layout={{
                ...defaultLayout,
                barmode: 'group',
                xaxis: {
                  ...defaultLayout.xaxis,
                  tickangle: -45,
                  title: processedData?.summary.categoricalColumns[0] || '',
                },
                yaxis: {
                  ...defaultLayout.yaxis,
                  title: 'Count',
                },
              }}
              config={defaultConfig}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-white/50">
              No categorical data available
            </div>
          )}
        </ChartCard>

        {/* Correlation Analysis */}
        <ChartCard
          title="Correlation Analysis"
          description="Relationship between variables"
          icon={<ScatterChart className="h-5 w-5 text-indigo-400" />}
          onExplain={() => handleExplain('correlation', chartData)}
          isExplaining={explaining['correlation']}
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

        {/* Proportional Analysis */}
        <ChartCard
          title="Proportional Analysis"
          description="Distribution across categories"
          icon={<PieChart className="h-5 w-5 text-indigo-400" />}
          onExplain={() => handleExplain('proportion', chartData)}
          isExplaining={explaining['proportion']}
        >
          {chartData.categoryData ? (
            <Plot
              data={[{
                type: 'pie',
                labels: chartData.categoryData.map(([cat]) => cat),
                values: chartData.categoryData.map(([, val]) => val),
                marker: { colors: COLORS },
              }]}
              layout={{ ...defaultLayout }}
              config={defaultConfig}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-white/50">
              No categorical data available
            </div>
          )}
        </ChartCard>

        {/* Outlier Detection */}
        <ChartCard
          title="Outlier Detection"
          description="Identify anomalies in data"
          icon={<ArrowUpDown className="h-5 w-5 text-indigo-400" />}
          onExplain={() => handleExplain('outlier', chartData)}
          isExplaining={explaining['outlier']}
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
      
      <AIExplanationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        content={explanation}
      />
    </div>
  );
};
