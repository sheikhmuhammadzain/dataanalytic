import React, { ReactNode, useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataSummary } from './components/DataSummary';
import { DefaultVisualizations } from './components/DefaultVisualizations';
import { DataTable } from './components/DataTable';
import { DataChat } from './components/DataChat';
import { useDataStore } from './store/dataStore';
import { BarChart2, Table2, Sparkles, ArrowRight, Download, Share2, FileText, Settings, HelpCircle, Calculator, FileDown, Filter } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { AdminPanel } from './components/AdminPanel';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Sidebar } from './components/ui/sidebar';
import { saveAs } from 'file-saver';
import { DataTransformations } from './components/DataTransformations';
import { downloadAnalyticsReport, downloadAnalyticsReportHTML } from './services/reportGenerator';

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

function App() {
  const { isAuthenticated, processedData, showAdminPanel, setShowAdminPanel } = useDataStore();
  const [showFilters, setShowFilters] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  // Show landing page if no data
  if (!processedData) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-xl shadow-sm">
          <nav className="flex h-16 items-center justify-between px-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <button 
                onClick={() => useDataStore.setState({ 
                  rawData: null, 
                  processedData: null, 
                  selectedColumns: [], 
                  transformationHistory: [], 
                  currentHistoryIndex: -1, 
                  error: null 
                })}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity ml-12 md:ml-0"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-full blur opacity-40 group-hover:opacity-75 transition" />
                  <BarChart2 className="h-6 w-6 relative text-gray-800" />
                </div>
                <h1 className="font-bold text-xl text-gray-800">
                  DataAnalytics
                </h1>
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <FileUpload 
                onUploadStart={() => {}} 
                onUploadComplete={() => {}}
              />
            </motion.div>
          </nav>
        </header>

        {/* Hero Section */}
        <div id="data-overview" className="relative border-b border-gray-200 bg-gray-50/50 backdrop-blur-sm">
          <div className="px-4 md:px-6 py-12">
            <DataSummary />
          </div>
        </div>

        <main className="px-4 md:px-6 py-8 space-y-8">
          {/* Data Manipulation Section */}
          <Card className="relative border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl md:text-2xl flex items-center gap-2 text-gray-900">
                    Data Transformations
                    <Calculator className="h-5 w-5 text-blue-600" />
                  </CardTitle>
                  <CardDescription>
                    Transform and manipulate your data with powerful tools
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DataTransformations />
              </motion.div>
            </CardContent>
          </Card>

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
                    <PremiumButton onClick={() => setShowFilters(prev => !prev)}>
                      <Settings className="h-4 w-4" />
                      Customize View
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
                  <DefaultVisualizations showFilters={showFilters} />
                </motion.div>
              </CardContent>
            </Card>

            {/* Data Preview Section */}
            <div id="data-preview">
              <Card className="relative border-gray-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl md:text-2xl flex items-center gap-2 text-gray-900">
                        Data Preview
                        <Table2 className="h-5 w-5 text-blue-600" />
                      </CardTitle>
                      <CardDescription>
                        Browse and search through your dataset
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <PremiumButton onClick={() => setShowFilters(prev => !prev)}>
                        <Filter className="h-4 w-4" />
                        Toggle Filters
                      </PremiumButton>
                      <PremiumButton 
                        onClick={() => handleDownloadAnalyticsReport('txt')} 
                        className={`${isDownloadingReport ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isDownloadingReport ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <FileText className="h-4 w-4" />
                            </motion.div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Insights Report
                          </>
                        )}
                      </PremiumButton>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable showFilters={showFilters} />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Chat Button */}
      <DataChat />
    </div>
  );
}

export default App;