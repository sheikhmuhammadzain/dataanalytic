import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  BarChart3,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartConfig } from '../ui/chart';
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { useManufacturingDataStore } from '../../store/manufacturingDataStore';
import type {
  CostOverrunData,
  CostVarianceData,
  CostEfficiencyData,
  OverallCostData
} from '../../services/manufacturingAnalyticsService';

interface CostMetrics {
  totalOverruns: number;
  overrunPercentage: number;
  avgEfficiencyIndex: number;
  totalCostVariance: number;
}

export const CostEfficiencyTab: React.FC = () => {
  const [metrics, setMetrics] = useState<CostMetrics>({
    totalOverruns: 0,
    overrunPercentage: 0,
    avgEfficiencyIndex: 0,
    totalCostVariance: 0
  });

  // Get data from central store
  const {
    costOverrunData,
    costVarianceByProductData: costVarianceData,
    costEfficiencyIndexData: costEfficiencyData,
    costVarianceData: overallCostData,
    isLoading: loading,
    hasData
  } = useManufacturingDataStore();

  useEffect(() => {
    if (hasData) {
      // Calculate metrics when data is available
      const totalOverruns = costOverrunData.reduce((sum, item) => 
        sum + (item.overrun_count || item.cost_overrun_batches || 0), 0);
      const totalBatches = costOverrunData.reduce((sum, item) => sum + (item.total_batches || 0), 0);
      const overrunPercentage = totalBatches > 0 ? (totalOverruns / totalBatches) * 100 : 0;
      const avgEfficiencyIndex = costEfficiencyData.reduce((sum, item) => sum + (item.avg_cost_efficiency_index || 0), 0) / (costEfficiencyData.length || 1);
      const totalCostVariance = costVarianceData.reduce((sum, item) => sum + Math.abs(item.total_cost_variance || 0), 0);

      setMetrics({
        totalOverruns,
        overrunPercentage,
        avgEfficiencyIndex,
        totalCostVariance
      });
    }
  }, [hasData, costOverrunData, costVarianceData, costEfficiencyData]);

  const overrunChartConfig: ChartConfig = {
    overrun_count: {
      label: 'Overrun Count',
      color: 'hsl(0, 70%, 50%)'
    },
    total_batches: {
      label: 'Total Batches',
      color: 'hsl(220, 70%, 50%)'
    }
  };

  const efficiencyChartConfig: ChartConfig = {
    avg_cost_efficiency_index: {
      label: 'Efficiency Index',
      color: 'hsl(120, 60%, 45%)'
    }
  };

  const overallCostChartConfig: ChartConfig = {
    total_standard_cost: {
      label: 'Standard Cost',
      color: 'hsl(220, 70%, 50%)'
    },
    total_actual_cost: {
      label: 'Actual Cost',
      color: 'hsl(0, 70%, 50%)'
    }
  };

  // Normalize data to handle different backend formats
  const normalizedOverrunData = costOverrunData.map(item => ({
    ...item,
    overrun_count: item.overrun_count || item.cost_overrun_batches || 0
  }));

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
              <CardTitle className="text-sm font-medium">Total Overruns</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalOverruns.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Cost overrun instances</p>
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
              <CardTitle className="text-sm font-medium">Overrun Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overrunPercentage.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Percentage of batches with overruns</p>
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
              <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgEfficiencyIndex.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Cost efficiency index</p>
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
              <CardTitle className="text-sm font-medium">Total Variance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.totalCostVariance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total cost variance</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Overrun Frequency */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Cost Overrun Frequency
              </CardTitle>
              <CardDescription>
                Overrun count vs total batches by period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={overrunChartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={normalizedOverrunData}>
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
                        `${Number(value).toLocaleString()}`, 
                        name === 'overrun_count' ? 'Overruns' : 'Total Batches'
                      ]}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Bar 
                      dataKey="overrun_count" 
                      fill="hsl(0, 70%, 50%)"
                      name="Overruns"
                    />
                    <Bar 
                      dataKey="total_batches" 
                      fill="hsl(220, 70%, 50%)"
                      name="Total Batches"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cost Efficiency Index */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Cost Efficiency Index
              </CardTitle>
              <CardDescription>
                Cost efficiency trend over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={efficiencyChartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={costEfficiencyData}>
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
                      formatter={(value) => [`${Number(value).toFixed(2)}`, 'Efficiency Index']}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_cost_efficiency_index" 
                      stroke="hsl(120, 60%, 45%)"
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

        {/* Overall Cost Variance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Overall Cost Variance
              </CardTitle>
              <CardDescription>
                Standard vs actual costs by period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={overallCostChartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overallCostData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="WIP_PERIOD_NAME" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      fontSize={10}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `$${Number(value).toLocaleString()}`, 
                        name === 'total_standard_cost' ? 'Standard Cost' : 'Actual Cost'
                      ]}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Bar 
                      dataKey="total_standard_cost" 
                      fill="hsl(220, 70%, 50%)"
                      name="Standard Cost"
                    />
                    <Bar 
                      dataKey="total_actual_cost" 
                      fill="hsl(0, 70%, 50%)"
                      name="Actual Cost"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cost Variance by Product Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Cost Variance by Product
              </CardTitle>
              <CardDescription>
                Products with highest cost variances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-semibold">Period</th>
                      <th className="text-left p-2 font-semibold">Product Type</th>
                      <th className="text-left p-2 font-semibold">Cost Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costVarianceData
                      .sort((a, b) => Math.abs(b.total_cost_variance) - Math.abs(a.total_cost_variance))
                      .slice(0, 20)
                      .map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{item.WIP_PERIOD_NAME}</td>
                          <td className="p-2">{item.PRODUCT_TYPE}</td>
                          <td className={`p-2 font-semibold ${
                            item.total_cost_variance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ${item.total_cost_variance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                
                {costVarianceData.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    No cost variance data available
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
