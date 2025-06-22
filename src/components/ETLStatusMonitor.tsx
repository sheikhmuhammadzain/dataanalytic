import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Activity, 
  Database, 
  HardDrive, 
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Upload,
  Brain,
  Zap
} from 'lucide-react';
import { llmMonitor, type LLMMetrics } from '../services/llmMonitor';

interface ETLStatusMonitorProps {
  theme: 'dark' | 'light';
  getThemeClass: (darkClass: string, lightClass: string) => string;
  processedData?: any;
  uploadedFiles?: any[];
  generatedReports?: any[];
  isProcessing?: boolean;
  transformationHistory?: any[];
}

export const ETLStatusMonitor: React.FC<ETLStatusMonitorProps> = ({ 
  theme, 
  getThemeClass, 
  processedData, 
  uploadedFiles = [],
  generatedReports = [],
  isProcessing = false,
  transformationHistory = []
}) => {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [systemUptime, setSystemUptime] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [llmMetrics, setLlmMetrics] = useState<LLMMetrics | null>(null);

  // Calculate real stats from application data
  const totalRecords = processedData?.summary?.rowCount || 0;
  
  // Calculate files processed today
  const processedToday = uploadedFiles.filter(file => {
    const today = new Date();
    const fileDate = new Date(file.uploadDate);
    return fileDate.toDateString() === today.toDateString();
  }).reduce((sum, file) => sum + (file.rowCount || 0), 0);

  // Calculate real storage usage from uploaded files
  const storageUsed = uploadedFiles.reduce((sum, file) => {
    const sizeInKB = parseFloat(file.size?.replace(/[^\d.]/g, '') || '0');
    return sum + sizeInKB;
  }, 0);

  // Add localStorage usage calculation
  const localStorageUsed = (() => {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return total / 1024; // Convert to KB
    } catch (e) {
      return 0;
    }
  })();

  const totalStorageUsed = storageUsed + localStorageUsed;
  const storageLimit = 5120; // 5MB in KB (more realistic limit)
  const storagePercentage = (totalStorageUsed / storageLimit) * 100;

  // Dynamic LLM Status based on real AI monitoring data
  const llmStatus = llmMetrics ? 
    (llmMetrics.currentStatus === 'busy' ? 'Processing' :
     llmMetrics.currentStatus === 'healthy' ? 'Ready' :
     llmMetrics.currentStatus === 'standby' ? 'Standby' :
     llmMetrics.currentStatus === 'error' ? 'Error' : 'Offline') : 'Offline';
  
  const apiConnection = llmMetrics ? 
    (llmMetrics.currentStatus === 'busy' ? `Processing via Gemini API (${llmMonitor.getActiveCalls()} active)` :
     llmMetrics.currentStatus === 'healthy' ? `Gemini API Connected (Health: ${Math.round(llmMetrics.apiHealthScore)}%)` :
     llmMetrics.currentStatus === 'standby' ? 'Gemini API Standby' :
     llmMetrics.currentStatus === 'error' ? `Gemini API Error (${llmMetrics.recentErrors.length} recent)` :
     'Gemini API Offline') : 'Gemini API Not Configured';

  // System Health based on real conditions
  const dataPipelineStatus = isProcessing ? 'Processing' :
                            totalRecords > 0 ? 'Healthy' : 
                            uploadedFiles.length > 0 ? 'Ready' : 'Inactive';
  
  const storageSystemStatus = storagePercentage > 90 ? 'Critical' :
                             storagePercentage > 80 ? 'Warning' :
                             storagePercentage > 60 ? 'Good' : 'Healthy';
  
  const apiConnectionStatus = llmMetrics ? 
                             (llmMetrics.currentStatus === 'busy' ? 'Processing' :
                              llmMetrics.currentStatus === 'healthy' ? 'Connected' :
                              llmMetrics.currentStatus === 'error' ? 'Error' :
                              'Standby') : 'Offline';

  // Calculate processing performance
  const recentTransformations = transformationHistory.filter(t => {
    const transformDate = new Date(t.timestamp);
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    return transformDate >= hourAgo;
  });

  // Use real LLM metrics for processing rate
  const processingRate = llmMetrics ? llmMetrics.callsLastHour : 0;
  const pendingItems = llmMetrics ? llmMonitor.getActiveCalls() : 0;

  // Calculate reports generated today
  const reportsToday = generatedReports.filter(report => {
    const today = new Date();
    const reportDate = new Date(report.generatedDate);
    return reportDate.toDateString() === today.toDateString();
  }).length;

  useEffect(() => {
    // Calculate uptime based on the oldest uploaded file
    if (uploadedFiles.length > 0) {
      const oldestFile = uploadedFiles.reduce((oldest, file) => {
        const fileDate = new Date(file.uploadDate);
        const oldestDate = new Date(oldest.uploadDate);
        return fileDate < oldestDate ? file : oldest;
      });
      
      const now = new Date();
      const startTime = new Date(oldestFile.uploadDate);
      const uptimeMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      setSystemUptime(uptimeMinutes);
    } else {
      setSystemUptime(0);
    }
  }, [uploadedFiles]);

  // Real-time uptime update
  useEffect(() => {
    const interval = setInterval(() => {
      if (uploadedFiles.length > 0) {
        setSystemUptime(prev => prev + 1);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [uploadedFiles.length]);

  // Subscribe to LLM metrics updates
  useEffect(() => {
    const unsubscribe = llmMonitor.subscribe((metrics) => {
      setLlmMetrics(metrics);
    });

    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastRefresh(new Date());
    
    // Test API health as part of refresh
    try {
      await llmMonitor.testApiHealth();
    } catch (error) {
      console.warn('API health check failed during refresh:', error);
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const formatUptime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`p-8 rounded-xl ${getThemeClass('bg-zinc-900 border border-zinc-800', 'bg-white border border-gray-200')}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-2 tracking-tight`}>
            ETL Status Monitor
          </h2>
          <p className={`${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
            Real-time system monitoring and analytics
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getThemeClass('bg-blue-600 hover:bg-blue-700 text-white', 'bg-blue-600 hover:bg-blue-700 text-white')} font-medium transition-colors disabled:opacity-50`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* LLM Status */}
        <div className={`p-6 rounded-xl ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}>
          <div className="flex items-center gap-3 mb-4">
            <Activity className={`w-5 h-5 ${getThemeClass('text-zinc-400', 'text-gray-600')}`} />
            <h3 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>LLM Status</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              llmStatus === 'Processing' ? 'bg-blue-500 animate-pulse' :
              llmStatus === 'Ready' ? 'bg-green-500' : 
              llmStatus === 'Standby' ? 'bg-yellow-500' : 
              llmStatus === 'Error' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
            }`}></div>
            <span className={`font-medium ${
              llmStatus === 'Processing' ? 'text-blue-500' :
              llmStatus === 'Ready' ? 'text-green-500' : 
              llmStatus === 'Standby' ? 'text-yellow-500' : 
              llmStatus === 'Error' ? 'text-red-500' : 'text-gray-500'
            }`}>
              {llmStatus}
            </span>
          </div>
          <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
            {apiConnection}
          </p>
        </div>

        {/* Data Volume */}
        <div className={`p-6 rounded-xl ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}>
          <div className="flex items-center gap-3 mb-4">
            <Database className={`w-5 h-5 ${getThemeClass('text-zinc-400', 'text-gray-600')}`} />
            <h3 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>Data Volume</h3>
          </div>
          <div className={`text-3xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-1`}>
            {totalRecords.toLocaleString()}
          </div>
          <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')} mb-2`}>
            Total records stored
          </p>
          <p className="text-sm text-green-500">
            +{processedToday.toLocaleString()} processed today
          </p>
        </div>

        {/* Storage Usage */}
        <div className={`p-6 rounded-xl ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}>
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className={`w-5 h-5 ${getThemeClass('text-zinc-400', 'text-gray-600')}`} />
            <h3 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>Storage Usage</h3>
          </div>
          <div className={`text-3xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-1`}>
            {totalStorageUsed.toFixed(1)} KB
          </div>
          <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
            {storagePercentage.toFixed(1)}% of {(storageLimit/1024).toFixed(1)}MB limit
          </p>
        </div>

        {/* System Uptime */}
        <div className={`p-6 rounded-xl ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}>
          <div className="flex items-center gap-3 mb-4">
            <Clock className={`w-5 h-5 ${getThemeClass('text-zinc-400', 'text-gray-600')}`} />
            <h3 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>System Uptime</h3>
          </div>
          <div className={`text-3xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-1`}>
            {formatUptime(systemUptime)}
          </div>
          <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')} mb-2`}>
            Since first data upload
          </p>
          <p className={`text-sm text-blue-500`}>
            Last sync: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Processing Performance & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Processing Performance */}
        <div className={`p-6 rounded-xl ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className={`w-5 h-5 ${getThemeClass('text-white', 'text-gray-900')}`} />
            <h3 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>
              Processing Performance
            </h3>
          </div>
          
          <div className="mb-6">
            <p className={`text-sm font-medium ${getThemeClass('text-zinc-300', 'text-gray-700')} mb-2`}>
              AI Processing Rate
            </p>
            <p className={`text-3xl font-bold ${getThemeClass('text-white', 'text-gray-900')}`}>
              {processingRate} calls/hr
            </p>
            {llmMetrics && (
              <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')} mt-1`}>
                Avg response: {llmMetrics.averageResponseTime}ms
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${getThemeClass('bg-zinc-700', 'bg-white border border-gray-200')}`}>
              <div className={`text-2xl font-bold text-green-500 mb-1`}>
                {processedToday.toLocaleString()}
              </div>
              <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                Records Today
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${getThemeClass('bg-zinc-700', 'bg-white border border-gray-200')}`}>
              <div className={`text-2xl font-bold ${pendingItems > 0 ? 'text-blue-500' : 'text-gray-500'} mb-1`}>
                {pendingItems}
              </div>
              <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                {pendingItems > 0 ? 'Processing' : 'Pending'}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className={`p-3 rounded-lg ${getThemeClass('bg-zinc-700', 'bg-white border border-gray-200')}`}>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                  Reports Generated Today
                </span>
                <span className={`font-bold text-purple-500`}>
                  {reportsToday}
                </span>
              </div>
            </div>
          </div>
          
          {/* AI Call Types Breakdown */}
          {llmMetrics && (
            <div className="mt-4">
              <h4 className={`text-sm font-medium ${getThemeClass('text-zinc-300', 'text-gray-700')} mb-3`}>
                AI Activity (Last Hour)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(llmMonitor.getCallsByType()).map(([type, count]) => (
                  <div key={type} className={`p-2 rounded ${getThemeClass('bg-zinc-700', 'bg-white border border-gray-200')}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${getThemeClass('text-zinc-400', 'text-gray-600')} capitalize`}>
                        {type.replace('_', ' ')}
                      </span>
                      <span className={`text-sm font-bold ${getThemeClass('text-white', 'text-gray-900')}`}>
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* System Health */}
        <div className={`p-6 rounded-xl ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}>
          <div className="flex items-center gap-3 mb-6">
            <Zap className={`w-5 h-5 ${getThemeClass('text-white', 'text-gray-900')}`} />
            <h3 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>
              System Health
            </h3>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Data Pipeline', status: dataPipelineStatus },
              { label: 'Storage System', status: storageSystemStatus },
              { label: 'API Connections', status: apiConnectionStatus },
              ...(llmMetrics ? [{ 
                label: `AI Service (${Math.round(llmMetrics.apiHealthScore)}% Health)`, 
                status: llmMetrics.currentStatus === 'healthy' || llmMetrics.currentStatus === 'busy' ? 'Connected' : 
                        llmMetrics.currentStatus === 'error' ? 'Error' : 'Standby'
              }] : [])
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className={`${getThemeClass('text-zinc-300', 'text-gray-700')}`}>
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  {item.status === 'Healthy' || item.status === 'Connected' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : item.status === 'Processing' ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : item.status === 'Warning' || item.status === 'Good' ? (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  ) : item.status === 'Critical' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                  )}
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    item.status === 'Healthy' || item.status === 'Connected'
                      ? 'bg-green-500/20 text-green-400'
                      : item.status === 'Processing'
                      ? 'bg-blue-500/20 text-blue-400'
                      : item.status === 'Warning' || item.status === 'Good'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : item.status === 'Critical'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-700">
            <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
              Last Health Check
            </p>
            <p className={`text-sm font-medium ${getThemeClass('text-white', 'text-gray-900')}`}>
              {lastRefresh.toLocaleDateString()}, {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Data Flow Overview */}
      <div>
        <h3 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-6`}>
          Data Flow Overview
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Data Ingestion */}
          <div className={`p-6 rounded-xl border-2 border-dashed ${getThemeClass('border-zinc-600 bg-zinc-800/50', 'border-gray-300 bg-gray-50')}`}>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-lg ${getThemeClass('bg-blue-500/20', 'bg-blue-100')} flex items-center justify-center mx-auto mb-4`}>
                <Upload className={`w-6 h-6 ${getThemeClass('text-blue-400', 'text-blue-600')}`} />
              </div>
              <h4 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>
                Data Ingestion
              </h4>
              <div className={`text-2xl font-bold ${getThemeClass('text-blue-400', 'text-blue-600')} mb-2`}>
                {totalRecords.toLocaleString()} records
              </div>
              <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                Files uploaded and parsed into JSON format
              </p>
            </div>
          </div>

          {/* Local Storage */}
          <div className={`p-6 rounded-xl border-2 border-dashed ${getThemeClass('border-zinc-600 bg-zinc-800/50', 'border-gray-300 bg-gray-50')}`}>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-lg ${getThemeClass('bg-green-500/20', 'bg-green-100')} flex items-center justify-center mx-auto mb-4`}>
                <Database className={`w-6 h-6 ${getThemeClass('text-green-400', 'text-green-600')}`} />
              </div>
              <h4 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>
                Local Storage
              </h4>
              <div className={`text-2xl font-bold ${getThemeClass('text-green-400', 'text-green-600')} mb-2`}>
                {totalStorageUsed.toFixed(1)} KB
              </div>
              <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                Data stored locally in browser storage
              </p>
            </div>
          </div>

          {/* LLM Processing */}
          <div className={`p-6 rounded-xl border-2 border-dashed ${getThemeClass('border-zinc-600 bg-zinc-800/50', 'border-gray-300 bg-gray-50')}`}>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-lg ${getThemeClass('bg-purple-500/20', 'bg-purple-100')} flex items-center justify-center mx-auto mb-4`}>
                <Brain className={`w-6 h-6 ${getThemeClass('text-purple-400', 'text-purple-600')}`} />
              </div>
              <h4 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>
                LLM Processing
              </h4>
              <div className={`text-2xl font-bold ${getThemeClass('text-purple-400', 'text-purple-600')} mb-2`}>
                {processedData ? 'Active' : 'Inactive'}
              </div>
              <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                AI analysis and insights generation
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 