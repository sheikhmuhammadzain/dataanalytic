import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingDown, 
  AlertTriangle, 
  BarChart3,
  Target,
  FileX
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartConfig } from '../ui/chart';
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { manufacturingAnalyticsService } from '../../services/manufacturingAnalyticsService';
import type {
  ScrapTrendData,
  ScrapContributorData,
  ScrapFactorData,
  DelayReasonData
} from '../../services/manufacturingAnalyticsService';

interface QualityMetrics {
  avgScrapRate: number;
  totalScrapQty: number;
  avgScrapFactor: number;
  topContributor: string;
}

export const QualityWasteTab: React.FC = () => {
  const [scrapTrendData, setScrapTrendData] = useState<ScrapTrendData[]>([]);
  const [scrapContributorData, setScrapContributorData] = useState<ScrapContributorData[]>([]);
  const [scrapFactorData, setScrapFactorData] = useState<ScrapFactorData[]>([]);
  const [delayReasonData, setDelayReasonData] = useState<DelayReasonData[]>([]);
  const [metrics, setMetrics] = useState<QualityMetrics>({
    avgScrapRate: 0,
    totalScrapQty: 0,
    avgScrapFactor: 0,
    topContributor: 'N/A'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQualityData();
  }, []);

  const loadQualityData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [scrapTrend, scrapContributors, scrapFactor, delayReasons] = await Promise.all([
        manufacturingAnalyticsService.getScrapRateTrend(),
        manufacturingAnalyticsService.getTopScrapContributors(8),
        manufacturingAnalyticsService.getScrapFactor(),
        manufacturingAnalyticsService.getDelayReasons()
      ]);

      setScrapTrendData(scrapTrend);
      setScrapContributorData(scrapContributors);
      setScrapFactorData(scrapFactor);
      setDelayReasonData(delayReasons);

      // Calculate metrics
      const avgScrapRate = scrapTrend.reduce((sum, item) => sum + (item.avg_scrap_rate || 0), 0) / (scrapTrend.length || 1);
      const totalScrapQty = scrapContributors.reduce((sum, item) => sum + (item.total_scrap_qty || 0), 0);
      const avgScrapFactor = scrapFactor.reduce((sum, item) => sum + (item.avg_scrap_factor || 0), 0) / (scrapFactor.length || 1);
      const topContributor = scrapContributors.length > 0 ? scrapContributors[0].PRODUCT_TYPE : 'N/A';

      setMetrics({
        avgScrapRate,
        totalScrapQty,
        avgScrapFactor,
        topContributor
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quality data');
    } finally {
      setLoading(false);
    }
  };

  const scrapTrendChartConfig: ChartConfig = {
    avg_scrap_rate: {
      label: 'Avg Scrap Rate',
      color: 'hsl(0, 70%, 50%)'
    }
  };

  const scrapContributorChartConfig: ChartConfig = {
    total_scrap_qty: {
      label: 'Total Scrap Qty',
      color: 'hsl(20, 80%, 55%)'
    }
  };

  const scrapFactorChartConfig: ChartConfig = {
    avg_scrap_factor: {
      label: 'Avg Scrap Factor',
      color: 'hsl(45, 85%, 50%)'
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
            <span>Error loading quality data: {error}</span>
          </div>
          <button
            onClick={loadQualityData}
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
              <CardTitle className="text-sm font-medium">Avg Scrap Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgScrapRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">Average scrap rate</p>
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
              <CardTitle className="text-sm font-medium">Total Scrap Qty</CardTitle>
              <FileX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalScrapQty.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Units scrapped</p>
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
              <CardTitle className="text-sm font-medium">Avg Scrap Factor</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgScrapFactor.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Scrap factor index</p>
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
              <CardTitle className="text-sm font-medium">Top Contributor</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{metrics.topContributor}</div>
              <p className="text-xs text-muted-foreground">Highest scrap contributor</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scrap Rate Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Scrap Rate Trend
              </CardTitle>
              <CardDescription>
                Average scrap rate over time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={scrapTrendChartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scrapTrendData}>
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
                      formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Scrap Rate']}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_scrap_rate" 
                      stroke="hsl(0, 70%, 50%)"
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

        {/* Top Scrap Contributors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Top Scrap Contributors
              </CardTitle>
              <CardDescription>
                Products contributing most to scrap quantity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={scrapContributorChartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={scrapContributorData} 
                    layout="horizontal"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="PRODUCT_TYPE" 
                      type="category" 
                      width={90}
                      fontSize={10}
                    />
                    <Tooltip
                      formatter={(value) => [`${Number(value).toLocaleString()} units`, 'Scrap Qty']}
                      labelFormatter={(label) => `Product: ${label}`}
                    />
                    <Bar 
                      dataKey="total_scrap_qty" 
                      fill="hsl(20, 80%, 55%)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scrap Factor Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-yellow-600" />
                Scrap Factor Analysis
              </CardTitle>
              <CardDescription>
                Scrap factor by period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={scrapFactorChartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scrapFactorData}>
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
                      formatter={(value) => [`${Number(value).toFixed(2)}`, 'Scrap Factor']}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Bar 
                      dataKey="avg_scrap_factor" 
                      fill="hsl(45, 85%, 50%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delay Reasons Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Delay Reasons
              </CardTitle>
              <CardDescription>
                Most common reasons for production delays
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-semibold">Period</th>
                      <th className="text-left p-2 font-semibold">Delay Reason</th>
                      <th className="text-left p-2 font-semibold">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delayReasonData.map((reason, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{reason.WIP_PERIOD_NAME}</td>
                        <td className="p-2">{reason.DELAY_REASON || 'N/A'}</td>
                        <td className="p-2 font-semibold">{reason.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {delayReasonData.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    No delay reason data available
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
