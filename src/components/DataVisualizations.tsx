import React, { useMemo, useState, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import Plot from 'react-plotly.js';
import { extent, mean, median, quantile, deviation } from 'd3-array';
import { Config, Layout } from 'plotly.js';

const COLORS = [
  '#6366f1', // indigo-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
];

type ChartType = 
  | 'distribution' 
  | 'correlation' 
  | '3d-scatter'
  | 'heatmap';

interface DataVisualizationsProps {
  defaultView?: ChartType;
}

export const DataVisualizations: React.FC<DataVisualizationsProps> = ({ defaultView = 'distribution' }) => {
  const processedData = useDataStore(state => state.processedData);
  const [selectedNumerical, setSelectedNumerical] = useState<string>('');
  const [chartType, setChartType] = useState<ChartType>(defaultView);
  const [secondaryNumerical, setSecondaryNumerical] = useState<string>('');

  // Compute tertiary column first
  const tertiaryColumn = useMemo(() => {
    if (!processedData?.summary?.numericalColumns) return '';
    return processedData.summary.numericalColumns.find(
      col => col !== selectedNumerical && col !== secondaryNumerical
    ) || processedData.summary.numericalColumns[0] || '';
  }, [processedData?.summary?.numericalColumns, selectedNumerical, secondaryNumerical]);

  // Default plot configuration
  const defaultConfig = useMemo((): Partial<Config> => ({
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'zoom2d', 'pan2d', 'autoScale2d'],
  }), []);

  // Default layout configuration
  const defaultLayout = useMemo((): Partial<Layout> => ({
    font: { family: 'Inter, sans-serif', color: '#ffffff99' },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { t: 40, r: 10, b: 40, l: 60 },
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
  }), []);

  // Distribution Analysis
  const distributionData = useMemo(() => {
    if (!processedData?.rows || !selectedNumerical) return null;
    const values = processedData.rows
      .map(row => row[selectedNumerical])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    const stats = {
      min: Math.min(...values),
      max: Math.max(...values),
      mean: mean(values) || 0,
      median: median(values) || 0,
      q1: quantile(values, 0.25) || 0,
      q3: quantile(values, 0.75) || 0,
      stdDev: deviation(values) || 0,
    };

    const kde = calculateKDE(values);
    return { stats, values, kde };
  }, [processedData?.rows, selectedNumerical]);

  // Correlation Analysis
  const correlationData = useMemo(() => {
    if (!processedData?.rows || !selectedNumerical || !processedData.summary.numericalColumns.length) return null;

    return processedData.summary.numericalColumns.map(col => {
      const data = processedData.rows
        .map(row => ({
          x: Number(row[selectedNumerical]),
          y: Number(row[col]),
        }))
        .filter(point => !isNaN(point.x) && !isNaN(point.y));

      const xValues = data.map(d => d.x);
      const yValues = data.map(d => d.y);
      
      return {
        column: col,
        pearson: calculatePearsonCorrelation(xValues, yValues),
        spearman: calculateSpearmanCorrelation(xValues, yValues),
        data,
      };
    });
  }, [processedData, selectedNumerical]);

  // Heatmap Correlation Matrix
  const correlationMatrix = useMemo(() => {
    if (!processedData?.rows || !processedData.summary.numericalColumns.length) return null;

    const { rows, summary: { numericalColumns } } = processedData;
    const matrix = numericalColumns.map(col1 => 
      numericalColumns.map(col2 => {
        const xValues = rows
          .map(row => Number(row[col1]))
          .filter(v => !isNaN(v));
        const yValues = rows
          .map(row => Number(row[col2]))
          .filter(v => !isNaN(v));
        return calculatePearsonCorrelation(xValues, yValues);
      })
    );

    return {
      z: matrix,
      x: numericalColumns,
      y: numericalColumns,
      text: matrix.map(row => row.map(val => val.toFixed(3))),
    };
  }, [processedData]);

  // 3D Scatter Plot Data
  const threeDScatterData = useMemo(() => {
    if (!processedData?.rows || !selectedNumerical || !secondaryNumerical || !tertiaryColumn) return null;
    
    return processedData.rows.map(row => ({
      x: Number(row[selectedNumerical]),
      y: Number(row[secondaryNumerical]),
      z: Number(row[tertiaryColumn]),
    })).filter(point => !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z));
  }, [processedData?.rows, selectedNumerical, secondaryNumerical, tertiaryColumn]);

  useEffect(() => {
    if (processedData?.summary?.numericalColumns?.length && !selectedNumerical) {
      setSelectedNumerical(processedData.summary.numericalColumns[0]);
      if (chartType === '3d-scatter' && processedData.summary.numericalColumns.length > 1) {
        setSecondaryNumerical(processedData.summary.numericalColumns[1]);
      }
    }
  }, [processedData?.summary?.numericalColumns, selectedNumerical, chartType]);

  if (!processedData?.rows?.length) return null;

  const { numericalColumns } = processedData.summary;

  const renderChart = () => {
    switch (chartType) {
      case 'distribution': {
        if (!distributionData) return null;
        return (
          <Plot
            data={[
              {
                type: 'violin',
                x: distributionData.values,
                name: selectedNumerical,
                box: { visible: true },
                meanline: { visible: true },
                points: false,
                line: { color: COLORS[0] },
              },
              {
                type: 'scatter',
                x: distributionData.kde.x,
                y: distributionData.kde.y,
                name: 'KDE',
                line: { color: COLORS[1] },
              },
            ]}
            layout={{
              ...defaultLayout,
              title: defaultView ? undefined : `Distribution Analysis: ${selectedNumerical}`,
              xaxis: { ...defaultLayout.xaxis, title: selectedNumerical },
              yaxis: { ...defaultLayout.yaxis, title: 'Density' },
            }}
            config={defaultConfig}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
          />
        );
      }

      case 'correlation': {
        if (!correlationData) return null;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {correlationData.map(({ column, data, pearson, spearman }, index) => (
              <Plot
                key={column}
                data={[
                  {
                    type: 'scatter',
                    mode: 'markers',
                    x: data.map(d => d.x),
                    y: data.map(d => d.y),
                    name: `${selectedNumerical} vs ${column}`,
                    marker: { color: COLORS[index % COLORS.length] },
                  },
                ]}
                layout={{
                  ...defaultLayout,
                  height: defaultView ? 300 : 400,
                  title: defaultView ? undefined : 
                    `Correlation: ${selectedNumerical} vs ${column}<br>Pearson: ${pearson.toFixed(3)}, Spearman: ${spearman.toFixed(3)}`,
                  xaxis: { ...defaultLayout.xaxis, title: selectedNumerical },
                  yaxis: { ...defaultLayout.yaxis, title: column },
                }}
                config={defaultConfig}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
              />
            ))}
          </div>
        );
      }

      case '3d-scatter': {
        if (!threeDScatterData) return null;
        return (
          <div className="h-[600px]">
            <Plot
              data={[
                {
                  type: 'scatter3d',
                  mode: 'markers',
                  x: threeDScatterData.map(d => d.x),
                  y: threeDScatterData.map(d => d.y),
                  z: threeDScatterData.map(d => d.z),
                  marker: {
                    size: 5,
                    color: threeDScatterData.map(d => d.x),
                    colorscale: 'Viridis',
                  },
                },
              ]}
              layout={{
                ...defaultLayout,
                scene: {
                  xaxis: { title: selectedNumerical },
                  yaxis: { title: secondaryNumerical },
                  zaxis: { title: tertiaryColumn },
                },
              }}
              config={defaultConfig}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler
            />
          </div>
        );
      }

      case 'heatmap': {
        if (!correlationMatrix) return null;
        return (
          <Plot
            data={[
              {
                type: 'heatmap',
                z: correlationMatrix.z,
                x: correlationMatrix.x,
                y: correlationMatrix.y,
                colorscale: [
                  [0, COLORS[0]],
                  [0.5, '#ffffff'],
                  [1, COLORS[2]],
                ],
                zmin: -1,
                zmax: 1,
                showscale: true,
                hoverongaps: false,
              },
            ]}
            layout={{
              ...defaultLayout,
              title: defaultView ? undefined : 'Correlation Matrix Heatmap',
              xaxis: { ...defaultLayout.xaxis, side: 'bottom' },
              yaxis: { ...defaultLayout.yaxis, autorange: 'reversed' },
            }}
            config={defaultConfig}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {!defaultView && (
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Analysis Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="flex h-10 w-full rounded-md border border-indigo-500/20 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <option value="distribution">Distribution Analysis</option>
              <option value="correlation">Correlation Analysis</option>
              <option value="3d-scatter">3D Scatter Plot</option>
              <option value="heatmap">Correlation Heatmap</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Primary Numerical Column</label>
            <select
              value={selectedNumerical}
              onChange={(e) => setSelectedNumerical(e.target.value)}
              className="flex h-10 w-full rounded-md border border-indigo-500/20 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {numericalColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {chartType === '3d-scatter' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Secondary Numerical Column</label>
              <select
                value={secondaryNumerical}
                onChange={(e) => setSecondaryNumerical(e.target.value)}
                className="flex h-10 w-full rounded-md border border-indigo-500/20 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {numericalColumns
                  .filter(col => col !== selectedNumerical)
                  .map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className={defaultView ? 'h-[300px]' : 'h-[400px]'}>
        {renderChart()}
      </div>
    </div>
  );
};

// Statistical utility functions
function calculateKDE(values: number[]): { x: number[]; y: number[] } {
  const bw = 0.9 * (deviation(values) || 1) * Math.pow(values.length, -0.2);
  const [minVal, maxVal] = extent(values) as [number, number];
  const step = (maxVal - minVal) / 100;
  const x = Array.from({ length: 101 }, (_, i) => minVal + i * step);
  const y = x.map(xi => mean(values.map(v => gaussian(xi - v, bw))) || 0);
  return { x, y };
}

function gaussian(x: number, bw: number): number {
  return (1 / (bw * Math.sqrt(2 * Math.PI))) * Math.exp(-(x * x) / (2 * bw * bw));
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const meanX = mean(x) || 0;
  const meanY = mean(y) || 0;
  const stdDevX = deviation(x) || 1;
  const stdDevY = deviation(y) || 1;
  const covariance = sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY))) / (n - 1);
  return covariance / (stdDevX * stdDevY);
}

function calculateSpearmanCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const xRanks = calculateRanks(x);
  const yRanks = calculateRanks(y);
  const diffSquared = sum(xRanks.map((r, i) => Math.pow(r - yRanks[i], 2)));
  return 1 - (6 * diffSquared) / (n * (n * n - 1));
}

function calculateRanks(values: number[]): number[] {
  return values
    .map((v, i) => ({ value: v, index: i }))
    .sort((a, b) => a.value - b.value)
    .map((v, i) => ({ ...v, rank: i + 1 }))
    .sort((a, b) => a.index - b.index)
    .map(v => v.rank);
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
