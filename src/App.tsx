import React, { ReactNode, useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataSummary } from './components/DataSummary';
import { DefaultVisualizations } from './components/DefaultVisualizations';
import { DataTable } from './components/DataTable';
import { DataChat } from './components/DataChat';
import { useDataStore } from './store/dataStore';
import { BarChart2, Table2, Sparkles, ArrowRight, Download, Share2, FileText, Settings, HelpCircle, Calculator, FileDown, Filter } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Menu, MenuItem, HoveredLink } from './components/ui/navbar-menu';
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
    className={`bg-gray-100 hover:bg-gray-200 no-underline group cursor-pointer relative shadow-sm border border-gray-200 rounded-full p-px text-xs font-semibold leading-6 text-gray-700 inline-block transition-all duration-300 ${className}`}
  >
    <span className="absolute inset-0 overflow-hidden rounded-full">
      <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(59,130,246,0.1)_0%,rgba(59,130,246,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </span>
    <div className="relative flex space-x-2 items-center z-10 rounded-full bg-white py-0.5 px-4 ring-1 ring-gray-200 group-hover:ring-blue-300">
      <span className="text-gray-700 group-hover:text-blue-700">{children}</span>
      <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
    </div>
    <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-blue-400/0 via-blue-400/50 to-blue-400/0 transition-opacity duration-500 group-hover:opacity-40" />
  </button>
);

function App() {
  const processedData = useDataStore(state => state.processedData);
  const [active, setActive] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setActive(null);
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

  if (!processedData) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Light Gradient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-blue-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 -right-4 w-[500px] h-[500px] bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-[500px] h-[500px] bg-purple-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <nav className="container flex h-16 items-center justify-between">
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
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
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
          <div className="flex-1 flex justify-center">
            <Menu setActive={setActive}>
              <MenuItem setActive={setActive} active={active} item="Analysis">
                <div className="flex flex-col space-y-4 text-sm">
                  <HoveredLink onClick={() => handleScroll('data-overview')}>
                    <FileText className="w-4 h-4 inline-block mr-2" />Data Overview
                  </HoveredLink>
                  <HoveredLink onClick={() => handleScroll('analytics-dashboard')}>
                    <BarChart2 className="w-4 h-4 inline-block mr-2" />Visualizations
                  </HoveredLink>
                  <HoveredLink onClick={() => handleScroll('data-preview')}>
                    <Table2 className="w-4 h-4 inline-block mr-2" />Data Table
                  </HoveredLink>
                </div>
              </MenuItem>
              <MenuItem setActive={setActive} active={active} item="Export">
                <div className="flex flex-col space-y-4 text-sm">
                  <HoveredLink onClick={handleDownloadCSV}>
                    <Download className="w-4 h-4 inline-block mr-2" />Download CSV
                  </HoveredLink>
                  <HoveredLink onClick={() => handleDownloadAnalyticsReport('txt')}>
                    <FileDown className="w-4 h-4 inline-block mr-2" />Insights Report (TXT)
                  </HoveredLink>
                  <HoveredLink onClick={() => handleDownloadAnalyticsReport('html')}>
                    <FileText className="w-4 h-4 inline-block mr-2" />Insights Report (HTML)
                  </HoveredLink>
                </div>
              </MenuItem>
              <MenuItem setActive={setActive} active={active} item="Help">
                <div className="flex flex-col space-y-4 text-sm">
                  <HoveredLink href="#"><HelpCircle className="w-4 h-4 inline-block mr-2" />Documentation</HoveredLink>
                  <HoveredLink href="#"><Sparkles className="w-4 h-4 inline-block mr-2" />AI Assistant</HoveredLink>
                </div>
              </MenuItem>
            </Menu>
          </div>
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
        <div className="container relative py-12">
          <DataSummary />
        </div>
      </div>

      <main className="container py-8 space-y-8">
        {/* Data Manipulation Section */}
        <Card className="relative border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-2 text-gray-900">
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
                  <CardTitle className="text-2xl flex items-center gap-2 text-gray-900">
                    Analytics Dashboard
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </CardTitle>
                  <CardDescription>
                    Comprehensive analysis and visualization of your data
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <PremiumButton onClick={() => handleScroll('analytics-dashboard')}>
                    <BarChart2 className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-600" />
                    <span className="text-gray-700 group-hover:text-blue-700">View All Charts</span>
                  </PremiumButton>
                  <PremiumButton onClick={() => setShowFilters(prev => !prev)}>
                    <Settings className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-600" />
                    <span className="text-gray-700 group-hover:text-blue-700">Customize View</span>
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
                          className="mr-2"
                        >
                          <Download className="h-4 w-4 text-gray-500" />
                        </motion.div>
                        <span className="text-gray-700">Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-600" />
                        <span className="text-gray-700 group-hover:text-blue-700">Insights Report</span>
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
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      Data Preview
                      <Table2 className="h-5 w-5 text-blue-600" />
                    </CardTitle>
                    <CardDescription>
                      Browse and search through your dataset
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <PremiumButton onClick={() => setShowFilters(prev => !prev)}>
                      <Filter className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-600" />
                      <span className="text-gray-700 group-hover:text-blue-700">Filter Data</span>
                    </PremiumButton>
                    <PremiumButton onClick={handleDownloadCSV}>
                      <Download className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-600" />
                      <span className="text-gray-700 group-hover:text-blue-700">Download CSV</span>
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
                            className="mr-2"
                          >
                            <FileText className="h-4 w-4 text-gray-500" />
                          </motion.div>
                          <span className="text-gray-700">Generating...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-600" />
                          <span className="text-gray-700 group-hover:text-blue-700">Insights Report</span>
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

      {/* Floating Chat Button */}
      <DataChat />

      <footer className="border-t border-gray-200 py-6 bg-gray-50 mt-8">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              © 2024 DataAnalytics. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;