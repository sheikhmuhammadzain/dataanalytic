import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  TrendingUp,
  DollarSign,
  Target,
  Link2,
  Cog,
  BarChart3
} from 'lucide-react';
import { manufacturingAnalyticsService } from '../services/manufacturingAnalyticsService';
import { useManufacturingDataStore } from '../store/manufacturingDataStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ProductionPerformanceTab } from './manufacturing-analytics/ProductionPerformanceTab';
import { QualityWasteTab } from './manufacturing-analytics/QualityWasteTab';
import { CostEfficiencyTab } from './manufacturing-analytics/CostEfficiencyTab';
import { PlanningAccuracyTab } from './manufacturing-analytics/PlanningAccuracyTab';
import { CorrelationsTab } from './manufacturing-analytics/CorrelationsTab';
import { OperationsTab } from './manufacturing-analytics/OperationsTab';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'production',
    label: 'Production Performance',
    icon: BarChart3,
    color: 'text-[#0052A5]',
    description: 'Batch throughput, duration, and bottleneck analysis'
  },
  {
    id: 'quality',
    label: 'Quality & Waste',
    icon: AlertTriangle,
    color: 'text-gray-600',
    description: 'Scrap rates, contributors, and delay analysis'
  },
  {
    id: 'costs',
    label: 'Cost & Efficiency',
    icon: DollarSign,
    color: 'text-gray-600',
    description: 'Cost variance, overruns, and efficiency metrics'
  },
  {
    id: 'planning',
    label: 'Planning Accuracy',
    icon: Target,
    color: 'text-gray-600',
    description: 'Forecast accuracy and variance hotspots'
  },
  {
    id: 'correlations',
    label: 'Correlations',
    icon: Link2,
    color: 'text-gray-600',
    description: 'Performance correlation analysis'
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Cog,
    color: 'text-gray-600',
    description: 'Material changes and replacement tracking'
  }
];

export const ManufacturingAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('production');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  
  // Use the central data store
  const { 
    isLoading: isLoadingData, 
    loadingProgress, 
    hasData,
    loadAllData
  } = useManufacturingDataStore();

  const testConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMessage('');
    
    try {
      const result = await manufacturingAnalyticsService.testConnection();
      
      if (result.success) {
        setConnectionStatus('connected');
        setConnectionMessage('✅ Connection successful!');
      } else {
        setConnectionStatus('failed');
        setConnectionMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setConnectionStatus('failed');
      setConnectionMessage(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    // Test connection on component mount
    testConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (connectionStatus === 'connected' && !hasData && !isLoadingData) {
      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus]);

  const handleLoadAllData = async () => {
    if (connectionStatus !== 'connected') {
      setConnectionMessage('❌ Please establish connection first');
      return;
    }

    await loadAllData();
    if (hasData) {
      setConnectionMessage('✅ All data loaded successfully!');
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'production':
        return <ProductionPerformanceTab />;
      case 'quality':
        return <QualityWasteTab />;
      case 'costs':
        return <CostEfficiencyTab />;
      case 'planning':
        return <PlanningAccuracyTab />;
      case 'correlations':
        return <CorrelationsTab />;
      case 'operations':
        return <OperationsTab />;
      default:
        return <ProductionPerformanceTab />;
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-[#0052A5]';
      case 'failed':
        return 'bg-gray-500';
      case 'testing':
        return 'bg-gray-400 animate-pulse';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Factory className="h-8 w-8 text-[#0052A5]" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-[#0052A5]">
                Manufacturing Analytics Dashboard
              </CardTitle>
              <CardDescription className="text-base">
                Professional data analytics platform for manufacturing intelligence and automated insights
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1">
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                API: https://data-analysis-dashboard-rho.vercel.app
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={testConnection}
                disabled={connectionStatus === 'testing'}
                className="flex items-center gap-2 px-4 py-2 bg-[#0052A5] text-white rounded-lg hover:bg-[#004080] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
                {connectionStatus === 'testing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    Test Connection
                  </>
                )}
              </button>
              
              <button
                onClick={handleLoadAllData}
                disabled={isLoadingData || connectionStatus !== 'connected'}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoadingData ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    {hasData ? 'Refresh Data' : 'Load All Data'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Connection Status Message */}
          <AnimatePresence>
            {connectionMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-lg ${
                  connectionStatus === 'connected' 
                    ? 'bg-blue-50 border border-blue-200 text-[#0052A5]' 
                    : connectionStatus === 'failed'
                    ? 'bg-gray-50 border border-gray-200 text-gray-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-700'
                }`}
              >
                {connectionMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Progress */}
          <AnimatePresence>
            {loadingProgress && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {loadingProgress}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex overflow-x-auto scrollbar-hide gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0052A5] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                  <span className="whitespace-nowrap text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Tab Description */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  );
};
