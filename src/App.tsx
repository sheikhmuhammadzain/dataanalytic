import React, { ReactNode, useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataSummary } from './components/DataSummary';
import { DefaultVisualizations } from './components/DefaultVisualizations';
import { DataTable } from './components/DataTable';
import { DataChat } from './components/DataChat';
import { useDataStore } from './store/dataStore';
import { BarChart2, Table2, Sparkles, ArrowRight, Download, Share2, FileText, Settings, HelpCircle, Calculator } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Menu, MenuItem, HoveredLink } from './components/ui/navbar-menu';
import { saveAs } from 'file-saver';
import { DataTransformations } from './components/DataTransformations';

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
    className={`bg-slate-800 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block ${className}`}
  >
    <span className="absolute inset-0 overflow-hidden rounded-full">
      <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </span>
    <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10">
      <span>{children}</span>
      <ArrowRight className="h-4 w-4" />
    </div>
    <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40" />
  </button>
);

function App() {
  const processedData = useDataStore(state => state.processedData);
  const [active, setActive] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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
    const rows = processedData.rows;

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
    saveAs(blob, 'data_export.csv');
  };

  if (!processedData) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-[#0a0118] relative">
      {/* Gradient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-[500px] h-[500px] bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-[500px] h-[500px] bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.2] bg-black/50 backdrop-blur-xl">
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
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/50 to-purple-500/50 rounded-full blur opacity-40 group-hover:opacity-75 transition" />
                <BarChart2 className="h-6 w-6 relative text-white/90" />
              </div>
              <h1 className="font-bold text-xl text-white/90">
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
              <MenuItem setActive={setActive} active={active} item="Settings">
                <div className="flex flex-col space-y-4 text-sm">
                  <HoveredLink href="#"><Settings className="w-4 h-4 inline-block mr-2" />Preferences</HoveredLink>
                  <HoveredLink href="#"><Download className="w-4 h-4 inline-block mr-2" />Export Data</HoveredLink>
                  <HoveredLink href="#"><Share2 className="w-4 h-4 inline-block mr-2" />Share</HoveredLink>
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
            <FileUpload />
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <div id="data-overview" className="relative border-b border-white/[0.2] bg-black/40 backdrop-blur-sm">
        <div className="container relative py-12">
          <DataSummary />
        </div>
      </div>

      <main className="container py-8 space-y-8">
        {/* Data Manipulation Section */}
        <Card className="relative border-white/[0.2] bg-black/40 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  Data Transformations
                  <Calculator className="h-5 w-5 text-indigo-400" />
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
          <Card className="relative border-white/[0.2] bg-black/40 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    Analytics Dashboard
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                  </CardTitle>
                  <CardDescription>
                    Comprehensive analysis and visualization of your data
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <PremiumButton onClick={() => handleScroll('analytics-dashboard')}>
                    View All Charts
                  </PremiumButton>
                  <PremiumButton onClick={() => setShowFilters(prev => !prev)}>
                    Customize View
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
            <Card className="relative border-white/[0.2] bg-black/40 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      Data Preview
                      <Table2 className="h-5 w-5 text-indigo-400" />
                    </CardTitle>
                    <CardDescription>
                      Browse and search through your dataset
                    </CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <PremiumButton onClick={() => setShowFilters(prev => !prev)}>
                      Filter Data
                    </PremiumButton>
                    <PremiumButton onClick={handleDownloadCSV}>
                      Download CSV
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

      <footer className="border-t border-white/[0.2] py-6 bg-black/40 backdrop-blur-sm mt-8">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/50">
              © 2024 DataAnalytics. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-white/50 hover:text-white/80 transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-white/50 hover:text-white/80 transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-white/50 hover:text-white/80 transition-colors">Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;