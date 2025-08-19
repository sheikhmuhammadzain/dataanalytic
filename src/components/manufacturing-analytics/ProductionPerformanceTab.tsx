import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  BarChart3,
  Activity,
  Timer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartConfig } from '../ui/chart';
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Pie, PieChart, Cell } from 'recharts';
import { manufacturingAnalyticsService } from '../../services/manufacturingAnalyticsService';
import type {
  BatchThroughputData,
  AverageBatchDurationData,
  BottleneckBatchData,
  DelaysData
} from '../../services/manufacturingAnalyticsService';

interface ProductionMetrics {
  totalBatches: number;
  avgThroughput: number;
  avgDuration: number;
  bottleneckCount: number;
}

export const ProductionPerformanceTab: React.FC = () => {
  const [throughputData, setThroughputData] = useState<BatchThroughputData[]>([]);
  const [durationData, setDurationData] = useState<AverageBatchDurationData[]>([]);
  const [bottleneckData, setBottleneckData] = useState<BottleneckBatchData[]>([]);
  const [delaysData, setDelaysData] = useState<DelaysData[]>([]);
  const [metrics, setMetrics] = useState<ProductionMetrics>({
    totalBatches: 0,
    avgThroughput: 0,
    avgDuration: 0,
    bottleneckCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProductionData();
  }, []);

  const loadProductionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [throughput, duration, bottlenecks, delays] = await Promise.all([
        manufacturingAnalyticsService.getBatchThroughputTrend(),
        manufacturingAnalyticsService.getAverageBatchDuration(),
        manufacturingAnalyticsService.getBottleneckBatches(10),
        manufacturingAnalyticsService.getDelays()
      ]);

      setThroughputData(throughput);
      setDurationData(duration);
      setBottleneckData(bottlenecks);
      setDelaysData(delays);

      // Calculate metrics
      const totalBatches = throughput.reduce((sum, item) => sum + (item.batches_completed || 0), 0);
      const avgThroughput = throughput.length > 0 ? totalBatches / throughput.length : 0;
      const avgDuration = duration.reduce((sum, item) => sum + (item.avg_duration_hours || 0), 0) / (duration.length || 1);

      setMetrics({
        totalBatches,
        avgThroughput,
        avgDuration,
        bottleneckCount: bottlenecks.length
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load production data');
    } finally {
      setLoading(false);
    }
  };

  const throughputChartConfig: ChartConfig = {
    batches_completed: {
      label: 'Batches Completed',
      color: 'hsl(200, 80%, 50%)'
    }
  };

  const durationChartConfig: ChartConfig = {
    avg_duration_hours: {
      label: 'Avg Duration (Hours)',
      color: 'hsl(280, 60%, 50%)'
    }
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Error loading production data: {error}</span>
          </div>
          <button
            onClick={loadProductionData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalBatches.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Production batches completed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Throughput</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgThroughput.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Batches per period</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgDuration.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">Average batch duration</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bottlenecks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.bottleneckCount}</div>
              <p className="text-xs text-muted-foreground">Identified bottleneck batches</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Throughput Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Batch Throughput Trend
              </CardTitle>
              <CardDescription>
                Number of batches completed per period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={throughputChartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={throughputData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="WIP_PERIOD_NAME" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} batches`, 'Batches Completed']}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="batches_completed" 
                      stroke="hsl(200, 80%, 50%)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Average Batch Duration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Average Batch Duration
              </CardTitle>
              <CardDescription>
                Average processing time per batch by period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={durationChartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="WIP_PERIOD_NAME" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${Number(value).toFixed(1)} hours`, 'Avg Duration']}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Bar 
                      dataKey="avg_duration_hours" 
                      fill="hsl(280, 60%, 50%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delays Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Delays Analysis
              </CardTitle>
              <CardDescription>
                Distribution of delayed batches by period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={delaysData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="delayed_batches"
                      label={({ WIP_PERIOD_NAME, delayed_batches, percent }) => 
                        `${WIP_PERIOD_NAME}: ${delayed_batches} (${(percent! * 100).toFixed(0)}%)`
                      }
                    >
                      {delaysData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} batches`, 'Delayed Batches']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottleneck Batches Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Bottleneck Batches
              </CardTitle>
              <CardDescription>
                Top 10 batches with longest processing times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-semibold">Period</th>
                      <th className="text-left p-2 font-semibold">Lot Number</th>
                      <th className="text-left p-2 font-semibold">Product</th>
                      <th className="text-left p-2 font-semibold">Duration (h)</th>
                      <th className="text-left p-2 font-semibold">Delay Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bottleneckData.slice(0, 10).map((batch, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{batch.WIP_PERIOD_NAME}</td>
                        <td className="p-2 font-mono text-xs">{batch.WIP_LOT_NUMBER}</td>
                        <td className="p-2">{batch.PRODUCT_TYPE}</td>
                        <td className="p-2 font-semibold">{batch.duration_hours?.toFixed(1) || 'N/A'}</td>
                        <td className="p-2 text-xs">{batch.DELAY_REASON || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {bottleneckData.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    No bottleneck data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
