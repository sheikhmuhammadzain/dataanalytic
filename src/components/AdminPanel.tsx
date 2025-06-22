import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Upload, User, Settings, BarChart2, Database, Activity, Download, Share2, FileText, TrendingUp, Users, Package, DollarSign, ChevronDown, Sparkles, ArrowRight } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { FileUpload } from './FileUpload';
import { generateSyntheticPaintsData } from '../services/gemini';
import { generateReport, reportTemplates } from '../services/reportTypes';

interface AdminPanelProps {
  theme: 'dark' | 'light';
  getThemeClass: (darkClass: string, lightClass: string) => string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ theme, getThemeClass }) => {
  const user = useDataStore(state => state.user);
  const logout = useDataStore(state => state.logout);
  const uploadedFiles = useDataStore(state => state.uploadedFiles);
  const processedData = useDataStore(state => state.processedData);
  const setRawData = useDataStore(state => state.setRawData);
  const setShowAdminPanel = useDataStore(state => state.setShowAdminPanel);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'html' | 'txt'>('html');
  const [selectedReportType, setSelectedReportType] = useState('data-summary');

  const handleLogout = () => {
    logout();
  };

  const handleGoToAnalytics = () => {
    setShowAdminPanel(false);
  };

  const handleGenerateSyntheticData = async () => {
    setIsGenerating(true);
    try {
      const syntheticData = await generateSyntheticPaintsData();
      setRawData(syntheticData, 'demo-paints-data.csv');
    } catch (error) {
      console.error('Failed to generate synthetic data:', error);
      // You could add a toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = async (templateId: string) => {
    if (!processedData) {
      alert('No data available. Please upload a CSV file or generate demo data first.');
      return;
    }

    setIsGeneratingReport(true);
    try {
      const result = await generateReport(templateId, processedData, selectedFormat);
      if (result.success) {
        console.log(`Report generated successfully: ${result.fileName}`);
        // You could add a success toast notification here
      } else {
        console.error('Report generation failed:', result.error);
        alert(`Failed to generate report: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('An unexpected error occurred while generating the report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleBulkReportGeneration = async () => {
    if (!processedData) {
      alert('No data available. Please upload a CSV file or generate demo data first.');
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Generate all report types
      for (const template of reportTemplates) {
        await generateReport(template.id, processedData, selectedFormat);
        // Small delay between reports to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      alert('All reports generated successfully!');
    } catch (error) {
      console.error('Error generating bulk reports:', error);
      alert('An error occurred while generating reports.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClass('bg-black', 'bg-white')}`}>
      {/* Admin Header */}
      <header className={`border-b ${getThemeClass('border-white/10 bg-black/50', 'border-gray-200 bg-white/90')} backdrop-blur-xl sticky top-0 z-50`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className={getThemeClass('text-indigo-500', 'text-[#0052A5]')} />
              <span className={`font-bold text-xl ${getThemeClass('bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text', 'text-[#0052A5]')}`}>
                Qubit Dynamics Admin
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getThemeClass('bg-white/10', 'bg-gray-100')}`}>
                <User className={`w-4 h-4 ${getThemeClass('text-white/70', 'text-gray-600')}`} />
                <span className={`text-sm ${getThemeClass('text-white/90', 'text-gray-800')}`}>
                  {user?.email}
                </span>
              </div>
              
              {processedData && (
                <button
                  onClick={handleGoToAnalytics}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getThemeClass('text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20', 'text-[#0052A5] hover:text-[#003d7a] hover:bg-blue-50 border border-blue-200')} transition-colors`}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Analytics Dashboard</span>
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getThemeClass('text-white/70 hover:text-white hover:bg-white/10', 'text-gray-600 hover:text-[#0052A5] hover:bg-gray-100')} transition-colors`}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Dashboard */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className={`text-3xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>
            Admin Dashboard
          </h1>
          <p className={`${getThemeClass('text-white/70', 'text-gray-600')}`}>
            Welcome to the admin panel. Upload and manage your CSV data files.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className={`p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')} shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${getThemeClass('bg-indigo-500/10', 'bg-blue-50')}`}>
                <Database className={`w-6 h-6 ${getThemeClass('text-indigo-400', 'text-[#0052A5]')}`} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${getThemeClass('text-white', 'text-gray-900')}`}>
                  {uploadedFiles.length}
                </h3>
                <p className={`text-sm ${getThemeClass('text-white/70', 'text-gray-600')}`}>
                  Files Uploaded
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')} shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${getThemeClass('bg-green-500/10', 'bg-green-50')}`}>
                <Activity className={`w-6 h-6 ${getThemeClass('text-green-400', 'text-green-600')}`} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${getThemeClass('text-white', 'text-gray-900')}`}>
                  Ready
                </h3>
                <p className={`text-sm ${getThemeClass('text-white/70', 'text-gray-600')}`}>
                  System Status
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')} shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${getThemeClass('bg-purple-500/10', 'bg-purple-50')}`}>
                <Settings className={`w-6 h-6 ${getThemeClass('text-purple-400', 'text-purple-600')}`} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${getThemeClass('text-white', 'text-gray-900')}`}>
                  Admin
                </h3>
                <p className={`text-sm ${getThemeClass('text-white/70', 'text-gray-600')}`}>
                  Access Level
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* File Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`p-8 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')} shadow-lg`}
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className={`w-20 h-20 mx-auto mb-4 rounded-full ${getThemeClass('bg-indigo-500/10', 'bg-blue-50')} flex items-center justify-center`}
            >
              <Upload className={`w-10 h-10 ${getThemeClass('text-indigo-400', 'text-[#0052A5]')}`} />
            </motion.div>
            <h2 className={`text-2xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>
              Upload CSV File
            </h2>
            <p className={`${getThemeClass('text-white/70', 'text-gray-600')} max-w-md mx-auto`}>
              Upload your CSV data file to start analyzing and visualizing your data. The system will automatically process and generate insights.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            {isLoading || isGenerating ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col items-center space-y-4 p-6 ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white/80 border border-[#0052A5]/20')} rounded-lg`}
              >
                <div className="relative">
                  <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${getThemeClass('border-indigo-500', 'border-[#0052A5]')}`}></div>
                  <div className={`absolute inset-0 animate-pulse rounded-full h-12 w-12 border-2 ${getThemeClass('border-indigo-400 opacity-50', 'border-[#0052A5] opacity-50')}`}></div>
                </div>
                <p className={`${getThemeClass('text-white/80', 'text-gray-800')} text-lg font-medium`}>
                  {isGenerating 
                    ? "Generating synthetic paints company data..." 
                    : "Processing your file..."
                  }
                </p>
              </motion.div>
            ) : (
              <>
                <FileUpload
                  className={`px-8 py-4 text-lg font-semibold text-white ${getThemeClass('bg-gradient-to-r from-indigo-500 to-purple-500', 'bg-gradient-to-r from-[#0052A5] to-[#0052A5]/80')} rounded-lg shadow-lg hover:shadow-xl transition-shadow`}
                  onUploadStart={() => setIsLoading(true)}
                  onUploadComplete={() => setIsLoading(false)}
                />
                
                <div className="flex items-center space-x-4">
                  <div className={`h-px ${getThemeClass('bg-white/20', 'bg-gray-300')} flex-1 max-w-20`}></div>
                  <span className={`text-sm font-medium ${getThemeClass('text-white/50', 'text-gray-500')}`}>OR</span>
                  <div className={`h-px ${getThemeClass('bg-white/20', 'bg-gray-300')} flex-1 max-w-20`}></div>
                </div>
                
                <div className="relative group">
                  <button
                    onClick={handleGenerateSyntheticData}
                    disabled={isGenerating}
                    className={`relative inline-block p-px font-semibold leading-6 ${getThemeClass('text-white bg-gray-800 shadow-zinc-900', 'text-white bg-gray-100 shadow-blue-900/10')} shadow-2xl cursor-pointer rounded-xl transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    <span className={`absolute inset-0 rounded-xl ${getThemeClass('bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500', 'bg-gradient-to-r from-[#0052A5] to-[#E63946]')} p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100`}></span>
                    
                    <span className={`relative z-10 block px-6 py-3 rounded-xl ${getThemeClass('bg-gray-950', 'bg-white')}`}>
                      <div className="relative z-10 flex items-center space-x-2">
                        <Sparkles className={`w-5 h-5 ${getThemeClass('text-white', 'text-[#0052A5]')} transition-transform duration-500 group-hover:translate-x-1`} />
                        <span className={`${getThemeClass('text-white', 'text-gray-800')} transition-all duration-500 group-hover:translate-x-1`}>
                          Try Demo Data
                        </span>
                        <ArrowRight className={`w-5 h-5 ${getThemeClass('text-white', 'text-[#0052A5]')} transition-transform duration-500 group-hover:translate-x-1`} />
                      </div>
                    </span>
                  </button>
                </div>
                
                <p className={`text-sm ${getThemeClass('text-white/50', 'text-gray-500')} text-center max-w-sm`}>
                  Try our demo with AI-generated paints company data to explore all features
                </p>
              </>
            )}

            <div className={`text-center p-4 rounded-lg ${getThemeClass('bg-white/5 border border-white/10', 'bg-blue-50 border border-blue-200')} max-w-md`}>
              <h4 className={`text-sm font-semibold ${getThemeClass('text-white', 'text-[#0052A5]')} mb-2`}>
                Supported Formats:
              </h4>
              <p className={`text-xs ${getThemeClass('text-white/70', 'text-gray-600')}`}>
                CSV files with headers • Maximum file size: 50MB • UTF-8 encoding recommended
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        {/* Reports & Export Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`mt-8 p-8 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')} shadow-lg`}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className={`text-2xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>
                Reports & Export
              </h2>
              <p className={`${getThemeClass('text-white/70', 'text-gray-600')}`}>
                Generate and download comprehensive reports
              </p>
            </div>
            <button className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getThemeClass('bg-white/10 hover:bg-white/20 text-white', 'bg-gray-900 hover:bg-gray-800 text-white')} transition-colors`}>
              <Share2 className="w-4 h-4" />
              Share Report
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Report Templates & Preview */}
            <div className="space-y-8">
              {/* Report Templates */}
              <div>
                <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
                  Report Templates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTemplates.map((template) => {
                    const IconComponent = template.icon === 'BarChart2' ? BarChart2 :
                                        template.icon === 'TrendingUp' ? TrendingUp :
                                        template.icon === 'FileText' ? FileText :
                                        template.icon === 'Activity' ? Activity : BarChart2;
                    
                    const iconColor = template.icon === 'BarChart2' ? 'text-blue-600' :
                                    template.icon === 'TrendingUp' ? 'text-green-600' :
                                    template.icon === 'FileText' ? 'text-purple-600' :
                                    template.icon === 'Activity' ? 'text-yellow-600' : 'text-blue-600';
                    
                    const iconColorDark = template.icon === 'BarChart2' ? 'text-blue-400' :
                                         template.icon === 'TrendingUp' ? 'text-green-400' :
                                         template.icon === 'FileText' ? 'text-purple-400' :
                                         template.icon === 'Activity' ? 'text-yellow-400' : 'text-blue-400';

                    return (
                      <div 
                        key={template.id}
                        onClick={() => handleGenerateReport(template.id)}
                        className={`p-4 rounded-xl border ${getThemeClass('border-white/20 bg-white/5 hover:bg-white/10', 'border-gray-200 bg-gray-50 hover:bg-gray-100')} cursor-pointer transition-all duration-200 hover:scale-105 ${isGeneratingReport ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className={`w-5 h-5 ${getThemeClass(iconColorDark, iconColor)}`} />
                          <h4 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>{template.name}</h4>
                        </div>
                        <p className={`text-sm ${getThemeClass('text-white/60', 'text-gray-600')}`}>{template.description}</p>
                        {isGeneratingReport && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className={`animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 ${getThemeClass('border-white', 'border-gray-600')}`}></div>
                            <span className={`text-xs ${getThemeClass('text-white/70', 'text-gray-500')}`}>Generating...</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Report Preview */}
              <div>
                <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
                  Report Preview
                </h3>
                {uploadedFiles.length > 0 ? (
                  <div className={`p-6 rounded-xl border ${getThemeClass('border-white/20 bg-white/5', 'border-gray-200 bg-gray-50')}`}>
                    <h4 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-6`}>
                      Data Analysis Report - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className={`text-sm ${getThemeClass('text-white/60', 'text-gray-600')} mb-1`}>Total Files</p>
                        <p className={`text-2xl font-bold ${getThemeClass('text-blue-400', 'text-blue-600')} mb-1`}>{uploadedFiles.length}</p>
                        <p className="text-sm text-green-500">Active datasets</p>
                      </div>
                      <div>
                        <p className={`text-sm ${getThemeClass('text-white/60', 'text-gray-600')} mb-1`}>Total Records</p>
                        <p className={`text-2xl font-bold ${getThemeClass('text-green-400', 'text-green-600')} mb-1`}>
                          {uploadedFiles.reduce((sum, file) => sum + file.rowCount, 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-green-500">Data points analyzed</p>
                      </div>
                    </div>

                    <div>
                      <p className={`text-sm font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-3`}>Recent Uploads</p>
                      <div className="space-y-2">
                        {uploadedFiles.slice(0, 3).map((file, index) => (
                          <div key={file.id} className="flex justify-between items-center">
                            <span className={`text-sm ${getThemeClass('text-white/80', 'text-gray-700')}`}>{file.name}</span>
                            <span className={`text-sm font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>
                              {file.rowCount.toLocaleString()} rows
                            </span>
                          </div>
                        ))}
                        {uploadedFiles.length > 3 && (
                          <div className="flex justify-between items-center">
                            <span className={`text-sm ${getThemeClass('text-white/60', 'text-gray-600')}`}>
                              +{uploadedFiles.length - 3} more files...
                            </span>
                            <span className={`text-sm ${getThemeClass('text-white/60', 'text-gray-600')}`}>
                              {uploadedFiles.slice(3).reduce((sum, file) => sum + file.rowCount, 0).toLocaleString()} rows
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`p-6 rounded-xl border ${getThemeClass('border-white/20 bg-white/5', 'border-gray-200 bg-gray-50')} text-center`}>
                    <Database className={`w-12 h-12 mx-auto mb-4 ${getThemeClass('text-white/30', 'text-gray-400')}`} />
                    <h4 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>
                      No Data Available
                    </h4>
                    <p className={`text-sm ${getThemeClass('text-white/60', 'text-gray-600')}`}>
                      Upload CSV files to generate data analysis reports
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Export Options & Recent Reports */}
            <div className="space-y-8">
              {/* Export Options */}
              <div>
                <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
                  Export Options
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${getThemeClass('text-white/90', 'text-gray-700')} mb-2`}>
                      Format
                    </label>
                    <div className={`relative`}>
                      <select 
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'html' | 'txt')}
                        className={`w-full p-3 rounded-lg ${getThemeClass('bg-white/10 border border-white/20 text-white', 'bg-gray-50 border border-gray-300 text-gray-900')} focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none`}
                      >
                        <option value="html">Interactive HTML</option>
                        <option value="pdf">PDF Report (Print to PDF)</option>
                        <option value="txt">Text Report</option>
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${getThemeClass('text-white/50', 'text-gray-400')} pointer-events-none`} />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getThemeClass('text-white/90', 'text-gray-700')} mb-2`}>
                      Quick Actions
                    </label>
                    <div className="space-y-3">
                      <button 
                        onClick={handleBulkReportGeneration}
                        disabled={!processedData || isGeneratingReport}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white ${getThemeClass('bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600', 'bg-gradient-to-r from-[#0052A5] to-[#0052A5]/80 hover:from-[#004080] hover:to-[#004080]/80')} transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Download className="w-5 h-5" />
                        {isGeneratingReport ? 'Generating...' : 'Generate All Reports'}
                      </button>
                      
                      <p className={`text-xs ${getThemeClass('text-white/60', 'text-gray-500')} text-center`}>
                        Click individual templates above or generate all reports at once
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Reports */}
              <div>
                <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
                  Recent Reports
                </h3>
                {uploadedFiles.length > 0 ? (
                  <div className="space-y-3">
                    {uploadedFiles.slice(0, 5).map((file, index) => {
                      const reportTypes = ['PDF', 'Excel', 'CSV'];
                      const colors = ['text-red-400', 'text-green-400', 'text-blue-400', 'text-purple-400', 'text-yellow-400'];
                      const lightColors = ['text-red-600', 'text-green-600', 'text-blue-600', 'text-purple-600', 'text-yellow-600'];
                      const reportType = reportTypes[index % reportTypes.length];
                      const colorClass = getThemeClass(colors[index % colors.length], lightColors[index % lightColors.length]);
                      
                      return (
                        <div key={file.id} className={`flex items-center justify-between p-3 rounded-lg ${getThemeClass('bg-white/5 border border-white/10', 'bg-gray-50 border border-gray-200')}`}>
                          <div className="flex items-center gap-3">
                            <FileText className={`w-5 h-5 ${colorClass}`} />
                            <div>
                              <p className={`font-medium ${getThemeClass('text-white', 'text-gray-900')}`}>
                                {file.name.replace('.csv', '')} Analysis
                              </p>
                              <p className={`text-xs ${getThemeClass('text-white/60', 'text-gray-600')}`}>
                                {new Date(file.uploadDate).toLocaleDateString()} • {reportType} • {file.rowCount.toLocaleString()} rows
                              </p>
                            </div>
                          </div>
                          <button 
                            className={`p-2 rounded-lg ${getThemeClass('hover:bg-white/10', 'hover:bg-gray-200')} transition-colors`}
                            onClick={() => {
                              // Here you could implement actual report download functionality
                              console.log('Download report for:', file.name);
                              alert('Report download functionality will be available after generating reports with the new system.');
                            }}
                          >
                            <Download className={`w-4 h-4 ${getThemeClass('text-white/70', 'text-gray-600')}`} />
                          </button>
                        </div>
                      );
                    })}
                    {uploadedFiles.length > 5 && (
                      <div className={`text-center py-2 ${getThemeClass('text-white/50', 'text-gray-500')}`}>
                        <p className="text-sm">
                          Showing 5 of {uploadedFiles.length} reports
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${getThemeClass('text-white/50', 'text-gray-500')}`}>
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No reports generated yet</p>
                    <p className="text-xs mt-1">Upload data files to create reports</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`mt-8 p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')} shadow-lg`}
        >
          <h3 className={`text-xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
            Recent Activity
          </h3>
          {uploadedFiles.length === 0 ? (
            <div className={`text-center py-12 ${getThemeClass('text-white/50', 'text-gray-500')}`}>
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity. Upload a file to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedFiles.slice(0, 10).map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${getThemeClass('bg-white/5 border border-white/10 hover:bg-white/10', 'bg-gray-50 border border-gray-200 hover:bg-gray-100')} transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getThemeClass('bg-indigo-500/10', 'bg-blue-50')}`}>
                      <FileText className={`w-5 h-5 ${getThemeClass('text-indigo-400', 'text-[#0052A5]')}`} />
                    </div>
                    <div>
                      <h4 className={`font-medium ${getThemeClass('text-white', 'text-gray-900')}`}>
                        {file.name}
                      </h4>
                      <p className={`text-sm ${getThemeClass('text-white/60', 'text-gray-600')}`}>
                        {new Date(file.uploadDate).toLocaleDateString()} • {file.rowCount} rows, {file.columnCount} columns • {file.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getThemeClass('bg-green-500/10 text-green-400', 'bg-green-100 text-green-600')}`}>
                      {file.type}
                    </span>
                    <button
                      className={`p-2 rounded-lg ${getThemeClass('hover:bg-white/10 text-white/70 hover:text-white', 'hover:bg-gray-200 text-gray-600 hover:text-[#0052A5]')} transition-colors`}
                      onClick={() => {
                        // You can add download/view functionality here
                        console.log('File clicked:', file);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {uploadedFiles.length > 10 && (
                <div className={`text-center py-2 ${getThemeClass('text-white/50', 'text-gray-500')}`}>
                  <p className="text-sm">
                    Showing 10 of {uploadedFiles.length} files
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}; 