import React, { ReactNode, useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataSummary } from './components/DataSummary';
import { DefaultVisualizations } from './components/DefaultVisualizations';
import { DataTable } from './components/DataTable';
import { ProductionDashboard } from './components/production/ProductionDashboard';
import { DataChat } from './components/DataChat';
import { useDataStore } from './store/dataStore';
import { BarChart2, Table2, Sparkles, ArrowRight, Download, Share2, FileText, Settings, HelpCircle, Calculator, FileDown, Filter, CheckCircle, X } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { AdminPanel } from './components/AdminPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Sidebar } from './components/ui/sidebar';
import { saveAs } from 'file-saver';

import { downloadAnalyticsReport, downloadAnalyticsReportHTML } from './services/reportGenerator';
import { detectManufacturingColumns } from './lib/manufacturingUtils';

interface PremiumButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({ 
  children, 
  onClick = () => {}, 
  className = "" 
}) => (
  <button 
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow ${className}`}
  >
    {children}
  </button>
);

// Session Restoration Notification Component
const SessionNotification: React.FC<{ show: boolean; onClose: () => void; fileName?: string; rowCount?: number }> = ({ 
  show, 
  onClose, 
  fileName, 
  rowCount 
}) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-sm"
      >
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">Session Restored!</p>
            <p className="text-sm text-green-600 mt-1">
              Your previous CSV data has been restored
            </p>
            {fileName && (
              <p className="text-xs text-green-500 mt-2 truncate">
                📄 {fileName}
              </p>
            )}
            {rowCount && (
              <p className="text-xs text-green-500">
                📊 {rowCount.toLocaleString()} rows loaded
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-green-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

function App() {
  const { 
    isAuthenticated, 
    processedData, 
    showAdminPanel, 
    setShowAdminPanel,
    loadCSVSession,
    uploadedFiles
  } = useDataStore();
  const [showFilters, setShowFilters] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSessionNotification, setShowSessionNotification] = useState(false);

  // Load CSV session on app initialization
  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      try {
        const sessionLoaded = loadCSVSession();
        if (sessionLoaded) {
          console.log('CSV session restored from localStorage');
          setShowSessionNotification(true);
          // Auto-hide notification after 5 seconds
          setTimeout(() => setShowSessionNotification(false), 5000);
        }
      } catch (error) {
        console.warn('Failed to load CSV session:', error);
      }
      setIsInitialized(true);
    }
  }, [isAuthenticated, loadCSVSession, isInitialized]);

  const getThemeClass = (darkClass: string, lightClass: string) => {
    return lightClass;
  };

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownloadCSV = () => {
    if (!processedData) return;

    const headers = processedData.headers;
    const rows = useDataStore.getState().getFilteredData();
    
    if (rows.length === 0) {
      alert('No data available to download');
      return;
    }

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      const rowData = headers.map(header => {
        const value = row[header];
        // Handle special characters and commas in the data
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csvContent += rowData.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `data-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDownloadAnalyticsReport = async (format: 'txt' | 'html' = 'txt') => {
    if (!processedData) return;
    
    setIsDownloadingReport(true);
    try {
      if (format === 'html') {
        await downloadAnalyticsReportHTML(processedData);
      } else {
        await downloadAnalyticsReport(processedData);
      }
    } catch (error) {
      console.error('Failed to download analytics report:', error);
      alert('Failed to generate analytics report. Please try again.');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Show admin panel if requested
  if (showAdminPanel) {
    return <AdminPanel theme="light" getThemeClass={getThemeClass} />;
  }

  // Show landing page if no data and initialization is complete
  if (!processedData && isInitialized) {
    return <LandingPage />;
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your session...</p>
        </div>
      </div>
    );
  }

  // Check if we have manufacturing data
  const isManufacturingData = processedData && 
    detectManufacturingColumns(processedData.headers).hasWipBatchNo && 
    detectManufacturingColumns(processedData.headers).hasWipValue;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Restoration Notification */}
      <SessionNotification
        show={showSessionNotification}
        onClose={() => setShowSessionNotification(false)}
        fileName={uploadedFiles[0]?.name}
        rowCount={processedData?.summary.rowCount}
      />

      {/* Sidebar */}
      <Sidebar
        onScrollTo={handleScroll}
        onDownloadCSV={handleDownloadCSV}
        onDownloadReport={handleDownloadAnalyticsReport}
        onShowAdminPanel={() => setShowAdminPanel(true)}
        isDownloadingReport={isDownloadingReport}
        onCollapseChange={setIsSidebarCollapsed}
      />

      {/* Light Gradient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-blue-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 -right-4 w-[500px] h-[500px] bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-[500px] h-[500px] bg-purple-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Main Content with sidebar offset */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>


        {/* Hero Section */}
        <div id="data-overview" className="relative border-b border-gray-200 bg-gray-50/50 backdrop-blur-sm">
          <div className="px-4 md:px-6 py-12">
            <DataSummary />
          </div>
        </div>

        <main className="px-4 md:px-6 py-8 space-y-8">
          {/* Analytics Dashboard */}
          <div id="analytics-dashboard" className="space-y-8">
            <Card className="relative border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl md:text-2xl flex items-center gap-2 text-gray-900">
                      Analytics Dashboard
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </CardTitle>
                    <CardDescription>
                      Comprehensive analysis and visualization of your data
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PremiumButton onClick={() => handleScroll('analytics-dashboard')}>
                      <BarChart2 className="h-4 w-4" />
                      View All Charts
                    </PremiumButton>
                 
                    <PremiumButton 
                      onClick={() => handleDownloadAnalyticsReport('html')} 
                      className={`${isDownloadingReport ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isDownloadingReport ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Download className="h-4 w-4" />
                          </motion.div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4" />
                          Insights Report
                        </>
                      )}
                    </PremiumButton>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {isManufacturingData ? (
                    <ProductionDashboard />
                  ) : (
                    <DefaultVisualizations showFilters={showFilters} />
                  )}
                </motion.div>
              </CardContent>
            </Card>

            {/* Data Preview Section */}
        
          </div>
        </main>
      </div>

      {/* Floating Chat Button */}
      <DataChat />
    </div>
  );
}

export default App;