import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartConfig } from '../ui/chart';
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { useManufacturingDataStore } from '../../store/manufacturingDataStore';
import type {
  ForecastAccuracyData,
  VarianceHotspotData,
  QuantityVarianceData,
  ReplacementCostData
} from '../../services/manufacturingAnalyticsService';

interface PlanningMetrics {
  avgMAPE: number;
  totalVariance: number;
  hotspotCount: number;
  avgReplacementCost: number;
}

export const PlanningAccuracyTab: React.FC = () => {
  const [metrics, setMetrics] = useState<PlanningMetrics>({
    avgMAPE: 0,
    totalVariance: 0,
    hotspotCount: 0,
    avgReplacementCost: 0
  });

  // Get data from central store
  const {
    forecastAccuracyData: forecastData,
    varianceHotspotsData: hotspotData,
    quantityVarianceData,
    replacementCostImpactData: replacementData,
    isLoading: loading,
    hasData
  } = useManufacturingDataStore();

  useEffect(() => {
    if (hasData) {
      // Calculate metrics when data is available
      const avgMAPE = forecastData.reduce((sum, item) => sum + (item.mape || 0), 0) / (forecastData.length || 1);
      const totalVariance = hotspotData.reduce((sum, item) => sum + Math.abs(item.total_qty_variance || 0), 0);
      const hotspotCount = hotspotData.length;
      const avgReplacementCost = replacementData.reduce((sum, item) => sum + (item.avg_extra_cost || 0), 0) / (replacementData.length || 1);

      setMetrics({
        avgMAPE,
        totalVariance,
        hotspotCount,
        avgReplacementCost
      });
    }
  }, [hasData, forecastData, hotspotData, quantityVarianceData, replacementData]);

  const forecastChartConfig: ChartConfig = {
    mape: {
      label: 'MAPE (%)',
      color: 'hsl(280, 60%, 50%)'
    }
  };

  const quantityChartConfig: ChartConfig = {
    total_plan_qty: {
      label: 'Plan Qty',
      color: 'hsl(200, 80%, 50%)'
    },
    total_wip_qty: {
      label: 'WIP Qty',
      color: 'hsl(120, 60%, 45%)'
    },
    total_original_qty: {
      label: 'Original Qty',
      color: 'hsl(270, 60%, 50%)'
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg MAPE</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {metrics.avgMAPE.toFixed(2)}%
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Variance</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {metrics.totalVariance.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Variance Hotspots</p>
                  <p className="text-2xl font-bold text-red-600">
                    {metrics.hotspotCount}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <Zap className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Replacement Cost</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${metrics.avgReplacementCost.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Accuracy Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Forecast Accuracy (MAPE)
              </CardTitle>
              <CardDescription>Mean Absolute Percentage Error over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={forecastChartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="WIP_PERIOD_NAME" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="mape"
                      stroke="hsl(280, 60%, 50%)"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(280, 60%, 50%)', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quantity Variance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Quantity Variance Analysis
              </CardTitle>
              <CardDescription>Plan vs WIP vs Original quantities</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={quantityChartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quantityVarianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="WIP_PERIOD_NAME" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total_plan_qty" fill="hsl(200, 80%, 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_wip_qty" fill="hsl(120, 60%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_original_qty" fill="hsl(270, 60%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Variance Hotspots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-red-600" />
                Variance Hotspots
              </CardTitle>
              <CardDescription>Products with highest quantity variance</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hotspotData.slice(0, 10)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="PRODUCT_TYPE" 
                      tick={{ fontSize: 10 }}
                      width={120}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="total_qty_variance"
                      fill="hsl(0, 70%, 50%)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Replacement Cost Impact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Replacement Cost Impact
              </CardTitle>
              <CardDescription>Cost impact by replacement reason</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={replacementData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="REASON" 
                      tick={{ fontSize: 10 }}
                      width={120}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="avg_extra_cost"
                      fill="hsl(120, 60%, 45%)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
