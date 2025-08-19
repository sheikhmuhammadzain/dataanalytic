import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartConfig } from '../ui/chart';
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { manufacturingAnalyticsService } from '../../services/manufacturingAnalyticsService';
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
  const [forecastData, setForecastData] = useState<ForecastAccuracyData[]>([]);
  const [hotspotData, setHotspotData] = useState<VarianceHotspotData[]>([]);
  const [quantityVarianceData, setQuantityVarianceData] = useState<QuantityVarianceData[]>([]);
  const [replacementData, setReplacementData] = useState<ReplacementCostData[]>([]);
  const [metrics, setMetrics] = useState<PlanningMetrics>({
    avgMAPE: 0,
    totalVariance: 0,
    hotspotCount: 0,
    avgReplacementCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlanningData();
  }, []);

  const loadPlanningData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [forecast, hotspots, quantityVariance, replacement] = await Promise.all([
        manufacturingAnalyticsService.getForecastAccuracy(),
        manufacturingAnalyticsService.getVarianceHotspots(15),
        manufacturingAnalyticsService.getQuantityVariance(),
        manufacturingAnalyticsService.getReplacementCostImpact()
      ]);

      setForecastData(forecast);
      setHotspotData(hotspots);
      setQuantityVarianceData(quantityVariance);
      setReplacementData(replacement);

      // Calculate metrics
      const avgMAPE = forecast.reduce((sum, item) => sum + (item.mape || 0), 0) / (forecast.length || 1);
      const totalVariance = hotspots.reduce((sum, item) => sum + Math.abs(item.total_qty_variance || 0), 0);
      const hotspotCount = hotspots.length;
      const avgReplacementCost = replacement.reduce((sum, item) => sum + (item.avg_extra_cost || 0), 0) / (replacement.length || 1);

      setMetrics({
        avgMAPE,
        totalVariance,
        hotspotCount,
        avgReplacementCost
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load planning data');
    } finally {
      setLoading(false);
    }
  };

  const forecastChartConfig: ChartConfig = {
    mape: {
      label: 'MAPE (%)',
      color: 'hsl(270, 60%, 50%)'
    }
  };

  const quantityChartConfig: ChartConfig = {
    total_plan_qty: {
      label: 'Plan Qty',
      color: 'hsl(220, 70%, 50%)'
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
            <span>Error loading planning data: {error}</span>
          </div>
          <button
            onClick={loadPlanningData}
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
              <CardTitle className="text-sm font-medium">Avg MAPE</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgMAPE.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Mean Absolute Percentage Error</p>
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
              <CardTitle className="text-sm font-medium">Total Variance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalVariance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Quantity variance units</p>
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
              <CardTitle className="text-sm font-medium">Hotspots</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.hotspotCount}</div>
              <p className="text-xs text-muted-foreground">Variance hotspots identified</p>
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
              <CardTitle className="text-sm font-medium">Avg Replacement Cost</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.avgReplacementCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Average replacement cost</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Forecast Accuracy
              </CardTitle>
              <CardDescription>
                Mean Absolute Percentage Error (MAPE) by period - Lower is better
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={forecastChartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData}>
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
                      label={{ value: 'MAPE (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value, name) => [`${Number(value).toFixed(2)}%`, 'MAPE']}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mape" 
                      stroke="hsl(270, 60%, 50%)"
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

        {/* Quantity Variance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Quantity Variance
              </CardTitle>
              <CardDescription>
                Planned vs WIP vs Original quantities by period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={quantityChartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quantityVarianceData}>
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
                        name === 'total_plan_qty' ? 'Plan Qty' :
                        name === 'total_wip_qty' ? 'WIP Qty' : 'Original Qty'
                      ]}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Bar 
                      dataKey="total_plan_qty" 
                      fill="hsl(220, 70%, 50%)"
                      name="Plan Qty"
                    />
                    <Bar 
                      dataKey="total_wip_qty" 
                      fill="hsl(120, 60%, 45%)"
                      name="WIP Qty"
                    />
                    <Bar 
                      dataKey="total_original_qty" 
                      fill="hsl(270, 60%, 50%)"
                      name="Original Qty"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Variance Hotspots Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                Variance Hotspots
              </CardTitle>
              <CardDescription>
                Products and periods with highest quantity variances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-semibold">Period</th>
                      <th className="text-left p-2 font-semibold">Product Type</th>
                      <th className="text-left p-2 font-semibold">Qty Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotspotData
                      .sort((a, b) => Math.abs(b.total_qty_variance) - Math.abs(a.total_qty_variance))
                      .map((hotspot, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{hotspot.WIP_PERIOD_NAME}</td>
                          <td className="p-2">{hotspot.PRODUCT_TYPE}</td>
                          <td className={`p-2 font-semibold ${
                            hotspot.total_qty_variance > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {hotspot.total_qty_variance > 0 ? '+' : ''}{hotspot.total_qty_variance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                
                {hotspotData.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    No variance hotspot data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Replacement Cost Impact Table */}
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
              <CardDescription>
                Cost impact analysis by replacement reason
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-semibold">Reason</th>
                      <th className="text-left p-2 font-semibold">Events</th>
                      <th className="text-left p-2 font-semibold">Avg Cost Variance</th>
                      <th className="text-left p-2 font-semibold">Avg Extra Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {replacementData
                      .sort((a, b) => (b.avg_extra_cost || 0) - (a.avg_extra_cost || 0))
                      .map((replacement, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{replacement.REASON || 'N/A'}</td>
                          <td className="p-2 font-semibold">{replacement.events}</td>
                          <td className={`p-2 font-semibold ${
                            (replacement.avg_cost_variance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ${(replacement.avg_cost_variance || 0).toLocaleString()}
                          </td>
                          <td className="p-2 font-semibold text-red-600">
                            ${(replacement.avg_extra_cost || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                
                {replacementData.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    No replacement cost data available
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
