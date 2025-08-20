interface BatchThroughputData {
  WIP_PERIOD_NAME: string;
  batches_completed: number;
}

interface AverageBatchDurationData {
  WIP_PERIOD_NAME: string;
  avg_duration_hours: number;
}

interface BottleneckBatchData {
  WIP_PERIOD_NAME: string;
  WIP_LOT_NUMBER: string;
  PRODUCT_TYPE: string;
  WIP_BATCH_STATUS: string;
  duration_hours: number;
  DELAY_REASON: string;
}

interface DelaysData {
  WIP_PERIOD_NAME: string;
  total_batches: number;
  delayed_batches: number;
}

interface ScrapTrendData {
  WIP_PERIOD_NAME: string;
  avg_scrap_rate: number;
}

interface ScrapContributorData {
  PRODUCT_TYPE: string;
  total_scrap_qty: number;
}

interface ScrapFactorData {
  WIP_PERIOD_NAME: string;
  avg_scrap_factor: number;
}

interface DelayReasonData {
  WIP_PERIOD_NAME: string;
  DELAY_REASON: string;
  count: number;
}

interface CostOverrunData {
  WIP_PERIOD_NAME: string;
  WIP_BATCH_STATUS?: string;
  overrun_count: number;
  total_batches: number;
  cost_overrun_batches?: number;
}

interface CostVarianceData {
  WIP_PERIOD_NAME?: string;
  PRODUCT_TYPE: string;
  total_cost_variance: number;
  total_standard_cost?: number;
  total_actual_cost?: number;
}

interface CostEfficiencyData {
  WIP_PERIOD_NAME: string;
  avg_cost_efficiency_index: number;
}

interface OverallCostData {
  WIP_PERIOD_NAME: string;
  total_standard_cost: number;
  total_actual_cost: number;
}

interface ForecastAccuracyData {
  WIP_PERIOD_NAME: string;
  WIP_BATCH_STATUS: string;
  avg_forecast_accuracy?: number;
  mape?: number;
}

interface VarianceHotspotData {
  WIP_PERIOD_NAME: string;
  PRODUCT_TYPE: string;
  total_qty_variance: number;
}

interface QuantityVarianceData {
  WIP_PERIOD_NAME: string;
  total_plan_qty: number;
  total_wip_qty: number;
  total_original_qty: number;
}

interface ReplacementCostData {
  REASON: string;
  events: number;
  avg_cost_variance: number;
  avg_extra_cost: number;
}

interface MaterialChangesData {
  WIP_PERIOD_NAME: string;
  WIP_BATCH_STATUS: string;
  WIP_LOT_NUMBER: string;
  total_qty_change: number;
}

interface ReplacementIdData {
  REASON: string;
  count: number;
}

interface CorrelationData {
  scope: string;
  pearson_r?: number;
  cost_delay_correlation?: number;
  planqty_scrap_correlation?: number;
  scrapfactor_costvariance_correlation?: number;
  delay_costvariance_correlation?: number;
  throughput_scrap_correlation?: number;
}

class ManufacturingAnalyticsService {
  private baseURL: string;

  constructor(baseURL?: string) {
    // Use proxy in development, direct API in production
    const defaultURL = import.meta.env.DEV 
      ? '/api' 
      : 'https://data-analysis-dashboard-rho.vercel.app';
    
    this.baseURL = baseURL ? (baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL) : defaultURL;
  }

  setBaseURL(url: string) {
    this.baseURL = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  private async fetchData<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      console.log(`Fetching: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} - Failed to fetch ${endpoint}`);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      
      // If we're not using proxy and it's a CORS error, try with CORS proxy
      if (!this.baseURL.includes('/api') && error instanceof TypeError && error.message.includes('fetch')) {
        try {
          console.log(`Trying CORS proxy for ${endpoint}`);
          const { CORSProxyService } = await import('./corsProxy');
          const response = await CORSProxyService.fetchWithProxy(url);
          const data = await response.json();
          console.log(`Successfully fetched ${endpoint} via proxy:`, data);
          return data;
        } catch (proxyError) {
          console.error(`CORS proxy also failed for ${endpoint}:`, proxyError);
        }
      }
      
      throw new Error(`Failed to fetch ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing connection to:', this.baseURL);
      
      // Try a simple endpoint first
      const testUrl = `${this.baseURL}/scrap-factor`;
      console.log('Testing URL:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Test connection successful, data received:', data);
      
      return { success: true, message: 'Connection successful!' };
    } catch (error) {
      console.error('Test connection failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  // Production Performance endpoints
  async getBatchThroughputTrend(): Promise<BatchThroughputData[]> {
    return this.fetchData<BatchThroughputData[]>('/batch-throughput-trend');
  }

  async getAverageBatchDuration(): Promise<AverageBatchDurationData[]> {
    return this.fetchData<AverageBatchDurationData[]>('/average-batch-duration');
  }

  async getBottleneckBatches(topN: number = 10): Promise<BottleneckBatchData[]> {
    return this.fetchData<BottleneckBatchData[]>(`/bottleneck-batches?top_n=${topN}`);
  }

  async getDelays(): Promise<DelaysData[]> {
    return this.fetchData<DelaysData[]>('/delays');
  }

  // Quality & Waste endpoints
  async getScrapRateTrend(): Promise<ScrapTrendData[]> {
    return this.fetchData<ScrapTrendData[]>('/scrap-rate-trend');
  }

  async getTopScrapContributors(topN: number = 8): Promise<ScrapContributorData[]> {
    return this.fetchData<ScrapContributorData[]>(`/top-scrap-contributors?top_n=${topN}`);
  }

  async getScrapFactor(): Promise<ScrapFactorData[]> {
    return this.fetchData<ScrapFactorData[]>('/scrap-factor');
  }

  async getDelayReasons(): Promise<DelayReasonData[]> {
    return this.fetchData<DelayReasonData[]>('/delay-reasons');
  }

  // Cost & Efficiency endpoints
  async getCostOverrunFrequency(): Promise<CostOverrunData[]> {
    return this.fetchData<CostOverrunData[]>('/cost-overrun-frequency');
  }

  async getCostVarianceByProduct(): Promise<CostVarianceData[]> {
    return this.fetchData<CostVarianceData[]>('/cost-variance-by-product');
  }

  async getCostEfficiencyIndex(): Promise<CostEfficiencyData[]> {
    return this.fetchData<CostEfficiencyData[]>('/cost-efficiency-index');
  }

  async getCostVariance(): Promise<OverallCostData[]> {
    return this.fetchData<OverallCostData[]>('/cost-variance');
  }

  // Planning Accuracy endpoints
  async getForecastAccuracy(): Promise<ForecastAccuracyData[]> {
    return this.fetchData<ForecastAccuracyData[]>('/forecast-accuracy');
  }

  async getVarianceHotspots(topN: number = 15): Promise<VarianceHotspotData[]> {
    return this.fetchData<VarianceHotspotData[]>(`/variance-hotspots?top_n=${topN}`);
  }

  async getQuantityVariance(): Promise<QuantityVarianceData[]> {
    return this.fetchData<QuantityVarianceData[]>('/quantity-variance');
  }

  async getReplacementCostImpact(): Promise<ReplacementCostData[]> {
    return this.fetchData<ReplacementCostData[]>('/replacement-cost-impact');
  }

  // Operations endpoints
  async getRawMaterialChanges(): Promise<MaterialChangesData[]> {
    return this.fetchData<MaterialChangesData[]>('/raw-material-changes');
  }

  async getReplacementIdentification(): Promise<ReplacementIdData[]> {
    return this.fetchData<ReplacementIdData[]>('/replacement-identification');
  }

  // Correlation endpoints
  async getScrapDelayCorrelation(): Promise<CorrelationData[]> {
    return this.fetchData<CorrelationData[]>('/scrap-delay-correlation');
  }

  async getCostDelayCorrelation(): Promise<{ cost_delay_correlation: number }> {
    return this.fetchData<{ cost_delay_correlation: number }>('/cost-delay-correlation');
  }

  async getPlanQtyScrapCorrelation(): Promise<{ planqty_scrap_correlation: number }> {
    return this.fetchData<{ planqty_scrap_correlation: number }>('/planqty-scrap-correlation');
  }

  async getScrapFactorCostVarianceCorrelation(): Promise<{ scrapfactor_costvariance_correlation: number }> {
    return this.fetchData<{ scrapfactor_costvariance_correlation: number }>('/scrapfactor-costvariance-correlation');
  }

  async getDelayeCostVarianceCorrelation(): Promise<{ delay_costvariance_correlation: number }> {
    return this.fetchData<{ delay_costvariance_correlation: number }>('/delay-costvariance-correlation');
  }

  async getThroughputScrapCorrelation(): Promise<{ throughput_scrap_correlation: number }> {
    return this.fetchData<{ throughput_scrap_correlation: number }>('/throughput-scrap-correlation');
  }

  async getCorrelationMatrix(): Promise<any> {
    return this.fetchData<any>('/correlation-matrix');
  }

  // Load all data for a specific section
  async loadProductionData() {
    return Promise.all([
      this.getBatchThroughputTrend(),
      this.getAverageBatchDuration(),
      this.getBottleneckBatches(),
      this.getDelays()
    ]);
  }

  async loadQualityData() {
    return Promise.all([
      this.getScrapRateTrend(),
      this.getTopScrapContributors(),
      this.getScrapFactor(),
      this.getDelayReasons()
    ]);
  }

  async loadCostData() {
    return Promise.all([
      this.getCostOverrunFrequency(),
      this.getCostVarianceByProduct(),
      this.getCostEfficiencyIndex(),
      this.getCostVariance()
    ]);
  }

  async loadPlanningData() {
    return Promise.all([
      this.getForecastAccuracy(),
      this.getVarianceHotspots(),
      this.getQuantityVariance(),
      this.getReplacementCostImpact()
    ]);
  }

  async loadOperationsData() {
    return Promise.all([
      this.getRawMaterialChanges(),
      this.getReplacementIdentification()
    ]);
  }

  async loadCorrelationData() {
    return Promise.all([
      this.getScrapDelayCorrelation(),
      this.getCostDelayCorrelation(),
      this.getPlanQtyScrapCorrelation(),
      this.getScrapFactorCostVarianceCorrelation(),
      this.getDelayeCostVarianceCorrelation(),
      this.getThroughputScrapCorrelation()
    ]);
  }
}

// Create a singleton instance
export const manufacturingAnalyticsService = new ManufacturingAnalyticsService();
export default ManufacturingAnalyticsService;

// Export types
export type {
  BatchThroughputData,
  AverageBatchDurationData,
  BottleneckBatchData,
  DelaysData,
  ScrapTrendData,
  ScrapContributorData,
  ScrapFactorData,
  DelayReasonData,
  CostOverrunData,
  CostVarianceData,
  CostEfficiencyData,
  OverallCostData,
  ForecastAccuracyData,
  VarianceHotspotData,
  QuantityVarianceData,
  ReplacementCostData,
  MaterialChangesData,
  ReplacementIdData,
  CorrelationData
};
