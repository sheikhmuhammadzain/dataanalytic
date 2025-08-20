import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  TrendingDown, 
  Package,
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartConfig } from '../ui/chart';
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Pie, PieChart, Cell } from 'recharts';
import { useManufacturingDataStore } from '../../store/manufacturingDataStore';
import type {
  ScrapTrendData,
  ScrapContributorData,
  ScrapFactorData,
  DelayReasonData
} from '../../services/manufacturingAnalyticsService';

interface QualityMetrics {
  avgScrapRate: number;
  avgScrapFactor: number;
  totalDelayedBatches: number;
  topContributor: string;
}

export const QualityWasteTab: React.FC = () => {
  const [metrics, setMetrics] = useState<QualityMetrics>({
    avgScrapRate: 0,
    avgScrapFactor: 0,
    totalDelayedBatches: 0,
    topContributor: 'N/A'
  });

  // Get data from central store
  const {
    scrapRateTrendData: scrapTrendData,
    topScrapContributorsData: scrapContributorData,
    scrapFactorData,
    delayReasonsData: delayReasonData,
    isLoading: loading,
    hasData
  } = useManufacturingDataStore();

  useEffect(() => {
    if (hasData) {
      // Calculate metrics when data is available
      const avgScrapRate = scrapTrendData.reduce((sum, item) => sum + (item.avg_scrap_rate || 0), 0) / (scrapTrendData.length || 1);
      const avgScrapFactor = scrapFactorData.reduce((sum, item) => sum + (item.avg_scrap_factor || 0), 0) / (scrapFactorData.length || 1);
      const totalDelayedBatches = delayReasonData.reduce((sum, item) => sum + (item.count || 0), 0);
      const topContributor = scrapContributorData.length > 0 
        ? scrapContributorData.sort((a, b) => (b.total_scrap_qty || 0) - (a.total_scrap_qty || 0))[0].PRODUCT_TYPE
        : 'N/A';

      setMetrics({
        avgScrapRate,
        avgScrapFactor,
        totalDelayedBatches,
        topContributor
      });
    }
  }, [hasData, scrapTrendData, scrapContributorData, scrapFactorData, delayReasonData]);

  const scrapTrendChartConfig: ChartConfig = {
    avg_scrap_rate: {
      label: 'Avg Scrap Rate',
      color: 'hsl(0, 70%, 50%)'
    }
  };

  const scrapFactorChartConfig: ChartConfig = {
    avg_scrap_factor: {
      label: 'Scrap Factor',
      color: 'hsl(300, 60%, 50%)'
    }
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];

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
                  <p className="text-sm font-medium text-gray-600">Avg Scrap Rate</p>
                  <p className="text-2xl font-bold text-red-600">
                    {metrics.avgScrapRate.toFixed(2)}%
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
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
                  <p className="text-sm font-medium text-gray-600">Avg Scrap Factor</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {metrics.avgScrapFactor.toFixed(3)}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
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
                  <p className="text-sm font-medium text-gray-600">Total Delayed Batches</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {metrics.totalDelayedBatches.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
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
                  <p className="text-sm font-medium text-gray-600">Top Scrap Contributor</p>
                  <p className="text-2xl font-bold text-purple-600 truncate">
                    {metrics.topContributor}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scrap Rate Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Scrap Rate Trend
              </CardTitle>
              <CardDescription>Average scrap rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={scrapTrendChartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scrapTrendData}>
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
                      dataKey="avg_scrap_rate"
                      stroke="hsl(0, 70%, 50%)"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(0, 70%, 50%)', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scrap Factor */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Scrap Factor Analysis
              </CardTitle>
              <CardDescription>Production efficiency factor</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={scrapFactorChartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scrapFactorData}>
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
                    <Bar
                      dataKey="avg_scrap_factor"
                      fill="hsl(300, 60%, 50%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Scrap Contributors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Top Scrap Contributors
              </CardTitle>
              <CardDescription>Products contributing most to scrap</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scrapContributorData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ PRODUCT_TYPE, percent }) => `${PRODUCT_TYPE}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total_scrap_qty"
                    >
                      {scrapContributorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delay Reasons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Delay Reasons Analysis
              </CardTitle>
              <CardDescription>Common causes of delays</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={delayReasonData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="DELAY_REASON" 
                      tick={{ fontSize: 10 }}
                      width={120}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="hsl(45, 80%, 60%)"
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
