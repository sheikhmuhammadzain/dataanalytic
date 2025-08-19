import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Link2, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Target,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { manufacturingAnalyticsService } from '../../services/manufacturingAnalyticsService';
import type { CorrelationData } from '../../services/manufacturingAnalyticsService';

interface CorrelationMetrics {
  strongCorrelations: number;
  moderateCorrelations: number;
  weakCorrelations: number;
  avgCorrelationStrength: number;
}

interface CorrelationResult {
  title: string;
  value: number | null;
  description: string;
  icon: React.ElementType;
  color: string;
}

export const CorrelationsTab: React.FC = () => {
  const [correlations, setCorrelations] = useState<CorrelationResult[]>([]);
  const [metrics, setMetrics] = useState<CorrelationMetrics>({
    strongCorrelations: 0,
    moderateCorrelations: 0,
    weakCorrelations: 0,
    avgCorrelationStrength: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCorrelationData();
  }, []);

  const loadCorrelationData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        scrapDelayCorr,
        costDelayCorr,
        planQtyScrapCorr,
        scrapFactorCostVarianceCorr,
        delayCostVarianceCorr,
        throughputScrapCorr
      ] = await Promise.all([
        manufacturingAnalyticsService.getScrapDelayCorrelation(),
        manufacturingAnalyticsService.getCostDelayCorrelation(),
        manufacturingAnalyticsService.getPlanQtyScrapCorrelation(),
        manufacturingAnalyticsService.getScrapFactorCostVarianceCorrelation(),
        manufacturingAnalyticsService.getDelayeCostVarianceCorrelation(),
        manufacturingAnalyticsService.getThroughputScrapCorrelation()
      ]);

      const correlationResults: CorrelationResult[] = [
        {
          title: 'Scrap vs Delay',
          value: extractCorrelationValue(scrapDelayCorr, 'pearson_r'),
          description: 'Correlation between scrap rates and production delays',
          icon: AlertTriangle,
          color: 'text-red-600'
        },
        {
          title: 'Cost vs Delay',
          value: costDelayCorr.cost_delay_correlation,
          description: 'Relationship between cost overruns and delays',
          icon: TrendingUp,
          color: 'text-orange-600'
        },
        {
          title: 'Plan Qty vs Scrap',
          value: planQtyScrapCorr.planqty_scrap_correlation,
          description: 'How planned quantities relate to scrap rates',
          icon: Target,
          color: 'text-blue-600'
        },
        {
          title: 'Scrap vs Cost Variance',
          value: scrapFactorCostVarianceCorr.scrapfactor_costvariance_correlation,
          description: 'Connection between scrap factors and cost variances',
          icon: TrendingDown,
          color: 'text-purple-600'
        },
        {
          title: 'Delay vs Cost Variance',
          value: delayCostVarianceCorr.delay_costvariance_correlation,
          description: 'Impact of delays on cost variance',
          icon: Activity,
          color: 'text-green-600'
        },
        {
          title: 'Throughput vs Scrap',
          value: throughputScrapCorr.throughput_scrap_correlation,
          description: 'How production throughput affects scrap rates',
          icon: Link2,
          color: 'text-indigo-600'
        }
      ];

      setCorrelations(correlationResults);

      // Calculate metrics
      const validCorrelations = correlationResults.filter(c => c.value !== null && !isNaN(c.value));
      const strongCount = validCorrelations.filter(c => Math.abs(c.value!) >= 0.7).length;
      const moderateCount = validCorrelations.filter(c => Math.abs(c.value!) >= 0.4 && Math.abs(c.value!) < 0.7).length;
      const weakCount = validCorrelations.filter(c => Math.abs(c.value!) < 0.4).length;
      const avgStrength = validCorrelations.length > 0 
        ? validCorrelations.reduce((sum, c) => sum + Math.abs(c.value!), 0) / validCorrelations.length 
        : 0;

      setMetrics({
        strongCorrelations: strongCount,
        moderateCorrelations: moderateCount,
        weakCorrelations: weakCount,
        avgCorrelationStrength: avgStrength
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load correlation data');
    } finally {
      setLoading(false);
    }
  };

  const extractCorrelationValue = (data: CorrelationData[], key: string): number | null => {
    if (Array.isArray(data) && data.length > 0) {
      const overallData = data.find(d => d.scope === 'overall');
      const value = overallData ? (overallData as any)[key] : (data[0] as any)[key];
      return typeof value === 'number' && !isNaN(value) ? value : null;
    }
    return null;
  };

  const getCorrelationStrength = (value: number | null): { text: string; color: string } => {
    if (value === null || isNaN(value)) return { text: 'No Data', color: 'text-gray-500' };
    
    const absValue = Math.abs(value);
    if (absValue >= 0.7) return { text: 'Strong', color: 'text-green-600' };
    if (absValue >= 0.4) return { text: 'Moderate', color: 'text-yellow-600' };
    return { text: 'Weak', color: 'text-red-500' };
  };

  const getCorrelationDirection = (value: number | null): string => {
    if (value === null || isNaN(value)) return '';
    return value > 0 ? 'Positive' : 'Negative';
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
            <span>Error loading correlation data: {error}</span>
          </div>
          <button
            onClick={loadCorrelationData}
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
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Strong Correlations</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.strongCorrelations}</div>
              <p className="text-xs text-muted-foreground">|r| ≥ 0.7</p>
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
              <CardTitle className="text-sm font-medium">Moderate Correlations</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{metrics.moderateCorrelations}</div>
              <p className="text-xs text-muted-foreground">0.4 ≤ |r| &lt; 0.7</p>
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
              <CardTitle className="text-sm font-medium">Weak Correlations</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{metrics.weakCorrelations}</div>
              <p className="text-xs text-muted-foreground">|r| &lt; 0.4</p>
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
              <CardTitle className="text-sm font-medium">Avg Strength</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgCorrelationStrength.toFixed(3)}</div>
              <p className="text-xs text-muted-foreground">Average correlation strength</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Correlation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {correlations.map((correlation, index) => {
          const Icon = correlation.icon;
          const strength = getCorrelationStrength(correlation.value);
          const direction = getCorrelationDirection(correlation.value);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${correlation.color}`} />
                  </div>
                  <CardTitle className="text-lg">{correlation.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {correlation.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-3">
                    <div className="text-3xl font-bold">
                      {correlation.value !== null && !isNaN(correlation.value) 
                        ? correlation.value.toFixed(3)
                        : 'N/A'
                      }
                    </div>
                    
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${strength.color} bg-gray-100`}>
                      {strength.text} {direction && `· ${direction}`}
                    </div>
                    
                    {correlation.value !== null && !isNaN(correlation.value) && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            Math.abs(correlation.value) >= 0.7 ? 'bg-green-500' :
                            Math.abs(correlation.value) >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.abs(correlation.value) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Interpretation Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-600" />
              Correlation Interpretation Guide
            </CardTitle>
            <CardDescription>
              Understanding correlation strength and direction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-600">Strong Correlation (≥0.7)</h4>
                <p className="text-sm text-gray-600">
                  Variables are highly related. Changes in one variable are strongly associated with changes in the other.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-green-500 rounded"></div>
                  <span className="text-xs">Actionable insights</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-yellow-600">Moderate Correlation (0.4-0.7)</h4>
                <p className="text-sm text-gray-600">
                  Variables have a moderate relationship. Some association exists but other factors also influence the relationship.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-yellow-500 rounded"></div>
                  <span className="text-xs">Worth investigating</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-red-500">Weak Correlation (&lt;0.4)</h4>
                <p className="text-sm text-gray-600">
                  Little to no linear relationship. Variables may be independent or have non-linear relationships.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-red-500 rounded"></div>
                  <span className="text-xs">Limited insight</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
