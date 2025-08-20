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
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useManufacturingDataStore } from '../../store/manufacturingDataStore';
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
  totalDelayedBatches: number;
  delayRate: number;
}

export const ProductionPerformanceTab: React.FC = () => {
  const [metrics, setMetrics] = useState<ProductionMetrics>({
    totalBatches: 0,
    avgThroughput: 0,
    avgDuration: 0,
    bottleneckCount: 0,
    totalDelayedBatches: 0,
    delayRate: 0
  });

  // Get data from central store
  const {
    batchThroughputData: throughputData,
    averageBatchDurationData: durationData,
    bottleneckBatchData: bottleneckData,
    delaysData,
    isLoading: loading,
    hasData
  } = useManufacturingDataStore();

  useEffect(() => {
    if (hasData) {
      // Calculate metrics when data is available
      const totalBatches = throughputData.reduce((sum, item) => sum + (item.batches_completed || 0), 0);
      const avgThroughput = throughputData.length > 0 ? totalBatches / throughputData.length : 0;
      const avgDuration = durationData.reduce((sum, item) => sum + (item.avg_duration_hours || 0), 0) / (durationData.length || 1);
      
      // Calculate delays metrics
      const totalDelayedBatches = delaysData.reduce((sum, item) => sum + (item.delayed_batches || 0), 0);
      const totalProcessedBatches = delaysData.reduce((sum, item) => sum + (item.total_batches || 0), 0);
      const delayRate = totalProcessedBatches > 0 ? (totalDelayedBatches / totalProcessedBatches) * 100 : 0;

      setMetrics({
        totalBatches,
        avgThroughput,
        avgDuration,
        bottleneckCount: bottleneckData.length,
        totalDelayedBatches,
        delayRate
      });
    }
  }, [hasData, throughputData, durationData, bottleneckData, delaysData]);

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



  if (loading || !hasData) {
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
              <CardTitle className="text-sm font-medium">Delayed Batches</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalDelayedBatches.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Delay rate: {metrics.delayRate.toFixed(2)}%
              </p>
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
                Total vs delayed batches by period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={delaysData.slice(0, 15)}>
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
                      formatter={(value, name) => [
                        `${value} batches`, 
                        name === 'total_batches' ? 'Total Batches' : 'Delayed Batches'
                      ]}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="total_batches" 
                      fill="hsl(200, 80%, 50%)"
                      radius={[4, 4, 0, 0]}
                      name="Total Batches"
                    />
                    <Bar 
                      dataKey="delayed_batches" 
                      fill="hsl(0, 70%, 50%)"
                      radius={[4, 4, 0, 0]}
                      name="Delayed Batches"
                    />
                  </BarChart>
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
