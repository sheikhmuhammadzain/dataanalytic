import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart2, 
  LogOut, 
  Database, 
  Settings, 
  Upload,
  FileText,
  TrendingUp,
  Activity,
  Sparkles,
  Key,
  Download,
  Trash2,
  Edit3,
  Eye,
  Copy
} from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { FileUpload } from './FileUpload';
import { generateSyntheticPaintsData } from '../services/gemini';
import { reportTemplates, generateReport, getAllReportTemplates } from '../services/reportTypes';

interface AdminPanelProps {
  theme: 'dark' | 'light';
  getThemeClass: (darkClass: string, lightClass: string) => string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ theme, getThemeClass }) => {
  const { user, logout, processedData, uploadedFiles, setShowAdminPanel, addGeneratedReport, generatedReports, deleteGeneratedReport } = useDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('data-analysis');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'html' | 'txt'>('pdf');
  const [dateRange, setDateRange] = useState<string>('last-month');
  
  // Settings state
  const [activeTab, setActiveTab] = useState<'files' | 'export' | 'api'>('files');
  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'Gemini AI', key: 'sk-...abc123', status: 'active' },
    { id: '2', name: 'OpenAI', key: 'sk-...def456', status: 'inactive' }
  ]);
  const [exportSettings, setExportSettings] = useState({
    defaultFormat: 'html',
    namingConvention: 'timestamp',
    includeMetadata: true
  });

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
      useDataStore.getState().setRawData(syntheticData, 'Synthetic_Paints_Data.csv');
    } catch (error) {
      console.error('Error generating synthetic data:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = async (templateId?: string, format?: 'pdf' | 'html' | 'txt') => {
    if (!processedData) {
      alert('Please upload data first to generate reports.');
      return;
    }
    
    const reportTemplateId = templateId || selectedTemplate;
    const reportFormat = format || exportFormat;
    
    setGeneratingReportId(reportTemplateId);
    try {
      const result = await generateReport(reportTemplateId, processedData, reportFormat);
      if (result.success && result.fileName) {
        console.log(`Report generated successfully: ${result.fileName}`);
        
        // Find template info
        const template = getAllReportTemplates().find(t => t.id === reportTemplateId);
        
        // Store report information
        const reportInfo = {
          id: Date.now().toString(),
          name: `${template?.name || 'Report'} - ${new Date().toLocaleDateString()}`,
          templateId: reportTemplateId,
          templateName: template?.name || 'Unknown Template',
          fileName: result.fileName,
          format: reportFormat,
          generatedDate: new Date().toISOString(),
          dataRowCount: processedData.summary.rowCount,
          dataColumnCount: processedData.summary.columnCount,
          status: 'success' as const
        };
        
        addGeneratedReport(reportInfo);
        
        // Show success message
        alert(`Report "${reportInfo.name}" generated successfully!`);
      } else {
        alert(`Failed to generate report: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReportId(null);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      // Remove from uploaded files
      const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
      useDataStore.setState({ uploadedFiles: updatedFiles });
      
      // Save to localStorage
      localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
    }
  };

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      deleteGeneratedReport(reportId);
    }
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert('API key copied to clipboard');
  };

  const handleToggleApiKey = (id: string) => {
    setApiKeys(keys => keys.map(key => 
      key.id === id 
        ? { ...key, status: key.status === 'active' ? 'inactive' : 'active' }
        : key
    ));
  };

  return (
    <div className={`min-h-screen ${getThemeClass('bg-black', 'bg-white')}`}>
      {/* Header */}
      <header className={`border-b ${getThemeClass('border-zinc-800 bg-black/80', 'border-gray-200 bg-white/80')} backdrop-blur-xl sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${getThemeClass('bg-white', 'bg-black')} flex items-center justify-center`}>
                <BarChart2 className={`w-5 h-5 ${getThemeClass('text-black', 'text-white')}`} />
              </div>
              <span className={`font-semibold text-lg ${getThemeClass('text-white', 'text-gray-900')}`}>
                Berger Paints
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getThemeClass('bg-zinc-800', 'bg-gray-100')} text-sm`}>
                <div className={`w-2 h-2 rounded-full ${getThemeClass('bg-green-400', 'bg-green-500')}`}></div>
                <span className={`${getThemeClass('text-zinc-300', 'text-gray-700')}`}>
                  {user?.email}
                </span>
              </div>
              
              {processedData && (
                <button
                  onClick={handleGoToAnalytics}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${getThemeClass('text-zinc-300 hover:text-white hover:bg-zinc-800', 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')} transition-all duration-200`}
                >
                  <BarChart2 className="w-4 h-4" />
                  Analytics
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${getThemeClass('text-zinc-400 hover:text-white hover:bg-zinc-800', 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')} transition-all duration-200`}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className={`text-4xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-3 tracking-tight`}>
            Dashboard
          </h1>
          <p className={`text-lg ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
            Upload and analyze your data with AI-powered insights.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className={`p-6 rounded-xl ${getThemeClass('bg-zinc-900 border border-zinc-800', 'bg-white border border-gray-200')} transition-colors hover:${getThemeClass('border-zinc-700', 'border-gray-300')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                  Files Uploaded
                </p>
                <p className={`text-3xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mt-1`}>
                  {uploadedFiles.length}
                </p>
              </div>
              <Database className={`w-5 h-5 ${getThemeClass('text-zinc-500', 'text-gray-400')}`} />
            </div>
          </div>

          <div className={`p-6 rounded-xl ${getThemeClass('bg-zinc-900 border border-zinc-800', 'bg-white border border-gray-200')} transition-colors hover:${getThemeClass('border-zinc-700', 'border-gray-300')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                  System Status
                </p>
                <p className={`text-3xl font-bold ${getThemeClass('text-green-400', 'text-green-600')} mt-1`}>
                  Ready
                </p>
              </div>
              <div className={`w-2 h-2 rounded-full ${getThemeClass('bg-green-400', 'bg-green-500')}`}></div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${getThemeClass('bg-zinc-900 border border-zinc-800', 'bg-white border border-gray-200')} transition-colors hover:${getThemeClass('border-zinc-700', 'border-gray-300')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                  Access Level
                </p>
                <p className={`text-3xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mt-1`}>
                  Admin
                </p>
              </div>
              <Settings className={`w-5 h-5 ${getThemeClass('text-zinc-500', 'text-gray-400')}`} />
            </div>
          </div>
        </motion.div>

        {/* Data Upload & ETL Pipeline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`p-8 rounded-xl ${getThemeClass('bg-zinc-900 border border-zinc-800', 'bg-white border border-gray-200')} mb-12`}
        >
          <div className="mb-8">
            <h2 className={`text-2xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2 tracking-tight`}>
              Data Upload & ETL Pipeline
            </h2>
            <p className={`${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
              Upload and process your business data files
            </p>
          </div>

          {/* Upload Data Files Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Upload className={`w-5 h-5 ${getThemeClass('text-white', 'text-gray-900')}`} />
              <h3 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>
                Upload Data Files
              </h3>
            </div>

            {isLoading || isGenerating ? (
              <div className={`flex flex-col items-center space-y-4 p-12 ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')} rounded-lg border-dashed`}>
                <div className={`animate-spin rounded-full h-8 w-8 border-2 border-t-transparent ${getThemeClass('border-white', 'border-gray-900')}`}></div>
                <p className={`${getThemeClass('text-zinc-300', 'text-gray-700')} font-medium`}>
                  {isGenerating ? "Generating demo data..." : "Processing file..."}
                </p>
              </div>
            ) : (
              <div className={`border-2 border-dashed ${getThemeClass('border-zinc-700', 'border-gray-300')} rounded-lg p-16 text-center transition-colors hover:${getThemeClass('border-zinc-600', 'border-gray-400')}`}>
                <div className="flex flex-col items-center">
                  <Upload className={`w-16 h-16 ${getThemeClass('text-zinc-500', 'text-gray-400')} mb-6`} />
                  <h4 className={`text-xl font-medium ${getThemeClass('text-white', 'text-gray-900')} mb-3`}>
                    Drop files here or click to upload
                  </h4>
                  <p className={`${getThemeClass('text-zinc-400', 'text-gray-600')} mb-8 text-sm`}>
                    Support for CSV, JSON, and TXT files (Max 10MB each)
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <FileUpload
                      className={`px-6 py-3 font-medium ${getThemeClass('bg-white text-black hover:bg-gray-100', 'bg-gray-900 text-white hover:bg-gray-800')} rounded-lg transition-colors`}
                      onUploadStart={() => setIsLoading(true)}
                      onUploadComplete={() => setIsLoading(false)}
                    />
                    
                    <button
                      onClick={handleGenerateSyntheticData}
                      disabled={isGenerating}
                      className={`px-6 py-3 font-medium ${getThemeClass('text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600', 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400')} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Try Demo Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ETL Pipeline Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-lg ${getThemeClass('bg-blue-500/20', 'bg-blue-100')} flex items-center justify-center mx-auto mb-3`}>
                <Database className={`w-6 h-6 ${getThemeClass('text-blue-400', 'text-blue-600')}`} />
              </div>
              <h4 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-1`}>Extract</h4>
              <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>Data extraction from files</p>
            </div>
            
            <div className="text-center">
              <div className={`w-12 h-12 rounded-lg ${getThemeClass('bg-orange-500/20', 'bg-orange-100')} flex items-center justify-center mx-auto mb-3`}>
                <FileText className={`w-6 h-6 ${getThemeClass('text-orange-400', 'text-orange-600')}`} />
              </div>
              <h4 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-1`}>Transform</h4>
              <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>Data parsing and JSON conversion</p>
            </div>
            
            <div className="text-center">
              <div className={`w-12 h-12 rounded-lg ${getThemeClass('bg-green-500/20', 'bg-green-100')} flex items-center justify-center mx-auto mb-3`}>
                <Activity className={`w-6 h-6 ${getThemeClass('text-green-400', 'text-green-600')}`} />
              </div>
              <h4 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-1`}>Load</h4>
              <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>Data storage for analysis</p>
            </div>
          </div>

          {/* Recent Uploads */}
          <div>
            <h3 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
              Recent Uploads
            </h3>
            
            {uploadedFiles.length > 0 ? (
              <div className="space-y-3">
                {uploadedFiles.slice(0, 3).map((file) => (
                  <div 
                    key={file.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getThemeClass('bg-zinc-700', 'bg-white')}`}>
                        <FileText className={`w-4 h-4 ${getThemeClass('text-zinc-400', 'text-gray-600')}`} />
                      </div>
                      <div>
                        <h4 className={`font-medium ${getThemeClass('text-white', 'text-gray-900')}`}>
                          {file.name}
                        </h4>
                        <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                          {new Date(file.uploadDate).toLocaleDateString()} • {file.size} • {file.rowCount.toLocaleString()} rows
                        </p>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 text-xs rounded-full ${getThemeClass('bg-green-500/20 text-green-400', 'bg-green-100 text-green-700')}`}>
                      Ready
                    </span>
                  </div>
                ))}
                
                {uploadedFiles.length > 3 && (
                  <div className="text-center">
                    <button className={`text-sm ${getThemeClass('text-zinc-400 hover:text-white', 'text-gray-600 hover:text-gray-900')} transition-colors`}>
                      View all {uploadedFiles.length} uploads
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={`text-center py-8 ${getThemeClass('text-zinc-500', 'text-gray-500')}`}>
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h4 className={`font-medium mb-2 ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                  No files uploaded yet. Upload your first file to get started!
                </h4>
              </div>
            )}
          </div>
        </motion.div>

        {/* Reports & Export Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`p-8 rounded-xl ${getThemeClass('bg-zinc-900 border border-zinc-800', 'bg-white border border-gray-200')} mb-12`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className={`text-2xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2 tracking-tight`}>
                Reports & Export
              </h2>
              <p className={`${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                Generate and download comprehensive reports
              </p>
            </div>
            <button className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getThemeClass('bg-white text-black hover:bg-gray-100', 'bg-gray-900 text-white hover:bg-gray-800')} font-medium transition-colors`}>
              <Sparkles className="w-4 h-4" />
              Share Report
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Report Templates & Preview */}
            <div className="lg:col-span-2 space-y-8">
              {/* Report Templates */}
              <div>
                <h3 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
                  Report Templates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getAllReportTemplates().map((template) => {
                    const IconComponent = template.icon === 'BarChart2' ? BarChart2 :
                                        template.icon === 'TrendingUp' ? TrendingUp :
                                        template.icon === 'FileText' ? FileText :
                                        template.icon === 'Activity' ? Activity : FileText;

                    const isSelected = selectedTemplate === template.id;
                    const isGeneratingThis = generatingReportId === template.id;

                    return (
                      <button 
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        disabled={isGeneratingThis}
                        className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                          isSelected 
                            ? getThemeClass('border-zinc-600 bg-zinc-700 ring-2 ring-blue-500', 'border-blue-200 bg-blue-50 ring-2 ring-blue-300')
                            : getThemeClass('border-zinc-700 hover:border-zinc-600 bg-zinc-800 hover:bg-zinc-700', 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100')
                        } group disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <IconComponent className={`w-5 h-5 ${
                            isSelected 
                              ? getThemeClass('text-blue-400', 'text-blue-600')
                              : getThemeClass('text-zinc-400', 'text-gray-600')
                          }`} />
                          {isGeneratingThis && (
                            <div className={`animate-spin rounded-full h-4 w-4 border-2 border-t-transparent ${getThemeClass('border-white', 'border-gray-900')}`}></div>
                          )}
                        </div>
                        <h4 className={`font-semibold mb-1 ${getThemeClass('text-white', 'text-gray-900')}`}>
                          {template.name}
                        </h4>
                        <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                          {template.description}
                        </p>
                        {isGeneratingThis && (
                          <p className={`text-xs mt-2 ${getThemeClass('text-blue-400', 'text-blue-600')}`}>
                            Generating...
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Report Preview */}
              <div>
                <h3 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
                  Report Preview
                </h3>
                <div className={`p-6 rounded-lg ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}>
                  {(() => {
                    const selectedTemplateData = getAllReportTemplates().find(t => t.id === selectedTemplate);
                    return (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h4 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>
                            {selectedTemplateData?.name || 'Data Analysis Report'} - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </h4>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleGenerateReport(selectedTemplate, 'html')}
                              disabled={!processedData || generatingReportId !== null}
                              className={`px-3 py-1.5 text-xs rounded-lg ${getThemeClass('bg-zinc-700 text-zinc-300 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500', 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400')} transition-colors disabled:cursor-not-allowed`}
                            >
                              Quick HTML
                            </button>
                            <button 
                              onClick={() => handleGenerateReport(selectedTemplate, 'pdf')}
                              disabled={!processedData || generatingReportId !== null}
                              className={`px-3 py-1.5 text-xs rounded-lg ${getThemeClass('bg-zinc-700 text-zinc-300 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500', 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400')} transition-colors disabled:cursor-not-allowed`}
                            >
                              Quick PDF
                            </button>
                          </div>
                        </div>
                        
                        {processedData ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')} mb-1`}>Dataset Size</p>
                                <p className={`text-2xl font-bold ${getThemeClass('text-blue-400', 'text-blue-600')} mb-1`}>
                                  {processedData.summary.rowCount.toLocaleString()}
                                </p>
                                <p className="text-sm text-green-500">rows of data</p>
                              </div>
                              <div>
                                <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')} mb-1`}>Columns</p>
                                <p className={`text-2xl font-bold ${getThemeClass('text-green-400', 'text-green-600')} mb-1`}>
                                  {processedData.summary.columnCount}
                                </p>
                                <p className="text-sm text-green-500">data fields</p>
                              </div>
                            </div>

                            <div>
                              <h5 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-3`}>Data Overview</h5>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className={`${getThemeClass('text-zinc-300', 'text-gray-700')}`}>Numerical Columns</span>
                                  <span className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>
                                    {processedData.summary.numericalColumns.length}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={`${getThemeClass('text-zinc-300', 'text-gray-700')}`}>Categorical Columns</span>
                                  <span className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>
                                    {processedData.summary.categoricalColumns.length}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={`${getThemeClass('text-zinc-300', 'text-gray-700')}`}>Report Type</span>
                                  <span className={`font-semibold ${getThemeClass('text-blue-400', 'text-blue-600')}`}>
                                    {selectedTemplateData?.name || 'Data Analysis'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className={`mt-4 p-4 rounded-lg ${getThemeClass('bg-zinc-900 border border-zinc-600', 'bg-blue-50 border border-blue-200')}`}>
                              <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')} mb-2`}>
                                Report Description:
                              </p>
                              <p className={`text-sm ${getThemeClass('text-zinc-300', 'text-gray-700')}`}>
                                {selectedTemplateData?.description || 'Comprehensive data analysis with insights and visualizations'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Database className={`w-12 h-12 mx-auto mb-4 ${getThemeClass('text-zinc-600', 'text-gray-400')} opacity-50`} />
                            <h5 className={`font-medium mb-2 ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                              No Data Available
                            </h5>
                            <p className={`text-sm ${getThemeClass('text-zinc-500', 'text-gray-500')}`}>
                              Upload your data to see a preview of the selected report
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Right Column - Export Options & Recent Reports */}
            <div className="space-y-8">
              {/* Export Options */}
              <div>
                <h3 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
                  Export Options
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${getThemeClass('text-zinc-300', 'text-gray-700')} mb-2`}>
                      Format
                    </label>
                    <select 
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'html' | 'txt')}
                      className={`w-full p-3 rounded-lg border ${getThemeClass('bg-zinc-800 border-zinc-700 text-white', 'bg-white border-gray-300 text-gray-900')} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="html">HTML Report</option>
                      <option value="txt">Text File</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${getThemeClass('text-zinc-300', 'text-gray-700')} mb-2`}>
                      Date Range
                    </label>
                    <select 
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className={`w-full p-3 rounded-lg border ${getThemeClass('bg-zinc-800 border-zinc-700 text-white', 'bg-white border-gray-300 text-gray-900')} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="last-month">Last Month</option>
                      <option value="last-3-months">Last 3 Months</option>
                      <option value="last-6-months">Last 6 Months</option>
                      <option value="last-year">Last Year</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => handleGenerateReport()}
                    disabled={!processedData || generatingReportId !== null}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${getThemeClass('bg-white text-black hover:bg-gray-100 disabled:bg-zinc-700 disabled:text-zinc-400', 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400')} font-medium transition-colors disabled:cursor-not-allowed`}
                  >
                    {generatingReportId ? (
                      <>
                        <div className={`animate-spin rounded-full h-4 w-4 border-2 border-t-transparent ${getThemeClass('border-current', 'border-current')}`}></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Generate Report
                      </>
                    )}
                  </button>
                  
                  {!processedData && (
                    <p className={`text-xs ${getThemeClass('text-zinc-500', 'text-gray-500')} text-center`}>
                      Upload data first to generate reports
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Reports */}
              <div>
                <h3 className={`text-lg font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
                  Recent Reports
                </h3>
                <div className="space-y-3">
                  {generatedReports.length > 0 ? (
                    generatedReports.slice(0, 3).map((report) => (
                      <div 
                        key={report.id}
                        className={`p-4 rounded-lg ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getThemeClass('bg-zinc-700', 'bg-white')}`}>
                              <FileText className={`w-4 h-4 ${getThemeClass('text-zinc-400', 'text-gray-600')}`} />
                            </div>
                            <div>
                              <h4 className={`font-medium ${getThemeClass('text-white', 'text-gray-900')}`}>
                                {report.name}
                              </h4>
                              <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                                {new Date(report.generatedDate).toLocaleDateString()} • {report.format.toUpperCase()} • {report.dataRowCount.toLocaleString()} rows
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              report.status === 'success'
                                ? getThemeClass('bg-green-500/20 text-green-400', 'bg-green-100 text-green-700')
                                : getThemeClass('bg-red-500/20 text-red-400', 'bg-red-100 text-red-700')
                            }`}>
                              {report.status === 'success' ? 'Ready' : 'Failed'}
                            </span>
                                                         <button
                               onClick={() => handleDeleteReport(report.id)}
                               className={`p-1 rounded ${getThemeClass('hover:bg-zinc-600 text-zinc-400 hover:text-red-400', 'hover:bg-red-50 text-gray-500 hover:text-red-600')} transition-colors`}
                               title="Delete Report"
                             >
                               <Trash2 className="w-3 h-3" />
                             </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-8 ${getThemeClass('text-zinc-500', 'text-gray-500')}`}>
                      <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <h4 className={`font-medium mb-1 ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                        No reports generated yet
                      </h4>
                      <p className="text-sm">
                        Generate reports to see them here
                      </p>
                    </div>
                  )}
                  
                  {generatedReports.length > 3 && (
                    <div className="text-center">
                      <button className={`text-sm ${getThemeClass('text-zinc-400 hover:text-white', 'text-gray-600 hover:text-gray-900')} transition-colors`}>
                        View all {generatedReports.length} reports
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Report History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={`p-8 rounded-xl ${getThemeClass('bg-zinc-900 border border-zinc-800', 'bg-white border border-gray-200')}`}
        >
          <div className="mb-6">
            <h2 className={`text-2xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-3 tracking-tight`}>
              Report History
            </h2>
            <p className={`${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
              Recently generated reports and downloads.
            </p>
          </div>

          {generatedReports.length > 0 ? (
            <div className="space-y-4">
              {generatedReports.map((report) => (
                <div 
                  key={report.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${getThemeClass('bg-zinc-700', 'bg-white')}`}>
                      <FileText className={`w-5 h-5 ${getThemeClass('text-zinc-400', 'text-gray-600')}`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>
                        {report.name}
                      </h4>
                      <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')} mb-1`}>
                        Template: {report.templateName} • Format: {report.format.toUpperCase()}
                      </p>
                      <p className={`text-sm ${getThemeClass('text-zinc-500', 'text-gray-500')}`}>
                        Generated: {new Date(report.generatedDate).toLocaleDateString()} at {new Date(report.generatedDate).toLocaleTimeString()} • {report.dataRowCount.toLocaleString()} rows × {report.dataColumnCount} columns
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      report.status === 'success'
                        ? getThemeClass('bg-green-500/20 text-green-400', 'bg-green-100 text-green-700')
                        : getThemeClass('bg-red-500/20 text-red-400', 'bg-red-100 text-red-700')
                    }`}>
                      {report.status === 'success' ? 'Successfully Generated' : 'Generation Failed'}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <button
                        className={`p-2 rounded-lg ${getThemeClass('hover:bg-zinc-600 text-zinc-400 hover:text-white', 'hover:bg-gray-200 text-gray-500 hover:text-gray-700')} transition-colors`}
                        title="View Report Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                                             <button
                         onClick={() => handleDeleteReport(report.id)}
                         className={`p-2 rounded-lg ${getThemeClass('hover:bg-red-900 text-zinc-400 hover:text-red-400', 'hover:bg-red-50 text-gray-500 hover:text-red-600')} transition-colors`}
                         title="Delete Report"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 ${getThemeClass('text-zinc-500', 'text-gray-500')}`}>
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className={`font-medium mb-2 ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                No reports generated yet
              </h3>
              <p className="text-sm">
                Upload data and generate reports to see them here
              </p>
            </div>
          )}
         </motion.div>

        {/* Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className={`mt-12 p-8 rounded-xl ${getThemeClass('bg-zinc-900 border border-zinc-800', 'bg-white border border-gray-200')}`}
        >
          <div className="mb-6">
            <h2 className={`text-2xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-3 tracking-tight`}>
              Management
            </h2>
            <p className={`${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
              Manage files, export settings, and API integrations.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className={`flex space-x-1 mb-6 p-1 rounded-lg ${getThemeClass('bg-zinc-800', 'bg-gray-100')}`}>
            {[
              { id: 'files', label: 'File Manager', icon: Database },
              { id: 'export', label: 'Export Settings', icon: Download },
              { id: 'api', label: 'API Keys', icon: Key }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'files' | 'export' | 'api')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === id
                    ? getThemeClass('bg-zinc-700 text-white', 'bg-white text-gray-900 shadow-sm')
                    : getThemeClass('text-zinc-400 hover:text-white hover:bg-zinc-700', 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'files' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                </div>
                
                {uploadedFiles.length > 0 ? (
                  <div className="space-y-3">
                    {uploadedFiles.map((file) => (
                      <div 
                        key={file.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getThemeClass('bg-zinc-700', 'bg-white')}`}>
                            <FileText className={`w-4 h-4 ${getThemeClass('text-zinc-400', 'text-gray-600')}`} />
                          </div>
                          <div>
                            <h4 className={`font-medium ${getThemeClass('text-white', 'text-gray-900')}`}>
                              {file.name}
                            </h4>
                            <p className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                              {new Date(file.uploadDate).toLocaleDateString()} • {file.size} • {file.rowCount.toLocaleString()} rows
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            className={`p-2 rounded-lg ${getThemeClass('hover:bg-zinc-600 text-zinc-400 hover:text-white', 'hover:bg-gray-200 text-gray-500 hover:text-gray-700')} transition-colors`}
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className={`p-2 rounded-lg ${getThemeClass('hover:bg-zinc-600 text-zinc-400 hover:text-white', 'hover:bg-gray-200 text-gray-500 hover:text-gray-700')} transition-colors`}
                            title="Rename"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className={`p-2 rounded-lg ${getThemeClass('hover:bg-red-900 text-zinc-400 hover:text-red-400', 'hover:bg-red-50 text-gray-500 hover:text-red-600')} transition-colors`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${getThemeClass('text-zinc-500', 'text-gray-500')}`}>
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No files uploaded yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${getThemeClass('text-white', 'text-gray-900')} mb-3`}>
                    Default Export Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['html', 'pdf', 'txt'].map((format) => (
                      <button
                        key={format}
                        onClick={() => setExportSettings(prev => ({ ...prev, defaultFormat: format }))}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          exportSettings.defaultFormat === format
                            ? getThemeClass('border-zinc-600 bg-zinc-700 text-white', 'border-gray-300 bg-gray-100 text-gray-900')
                            : getThemeClass('border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700', 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100')
                        }`}
                      >
                        <div className="font-medium">{format.toUpperCase()}</div>
                        <div className="text-xs mt-1">
                          {format === 'html' ? 'Interactive' : format === 'pdf' ? 'Print Ready' : 'Plain Text'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${getThemeClass('text-white', 'text-gray-900')} mb-3`}>
                    File Naming Convention
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'timestamp', label: 'Include Timestamp', example: 'report_2024-01-15_14-30.html' },
                      { id: 'sequential', label: 'Sequential Numbers', example: 'report_001.html' },
                      { id: 'custom', label: 'Custom Prefix', example: 'analysis_report.html' }
                    ].map(({ id, label, example }) => (
                      <label key={id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="naming"
                          value={id}
                          checked={exportSettings.namingConvention === id}
                          onChange={(e) => setExportSettings(prev => ({ ...prev, namingConvention: e.target.value }))}
                          className="w-4 h-4"
                        />
                        <div>
                          <div className={`font-medium ${getThemeClass('text-white', 'text-gray-900')}`}>{label}</div>
                          <div className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>{example}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportSettings.includeMetadata}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className={`font-medium ${getThemeClass('text-white', 'text-gray-900')}`}>Include Metadata</div>
                      <div className={`text-sm ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>Add file info, generation time, and settings to reports</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')}`}>
                    API Keys ({apiKeys.length})
                  </h3>
                  <button className={`px-4 py-2 rounded-lg text-sm font-medium ${getThemeClass('bg-zinc-700 text-white hover:bg-zinc-600', 'bg-gray-900 text-white hover:bg-gray-800')} transition-colors`}>
                    Add New Key
                  </button>
                </div>
                
                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div 
                      key={apiKey.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${getThemeClass('bg-zinc-800 border border-zinc-700', 'bg-gray-50 border border-gray-200')}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getThemeClass('bg-zinc-700', 'bg-white')}`}>
                          <Key className={`w-4 h-4 ${getThemeClass('text-zinc-400', 'text-gray-600')}`} />
                        </div>
                        <div>
                          <h4 className={`font-medium ${getThemeClass('text-white', 'text-gray-900')}`}>
                            {apiKey.name}
                          </h4>
                          <p className={`text-sm font-mono ${getThemeClass('text-zinc-400', 'text-gray-600')}`}>
                            {apiKey.key}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          apiKey.status === 'active' 
                            ? getThemeClass('bg-green-500/20 text-green-400', 'bg-green-100 text-green-700')
                            : getThemeClass('bg-red-500/20 text-red-400', 'bg-red-100 text-red-700')
                        }`}>
                          {apiKey.status}
                        </span>
                        <button
                          onClick={() => handleCopyApiKey(apiKey.key)}
                          className={`p-2 rounded-lg ${getThemeClass('hover:bg-zinc-600 text-zinc-400 hover:text-white', 'hover:bg-gray-200 text-gray-500 hover:text-gray-700')} transition-colors`}
                          title="Copy Key"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleApiKey(apiKey.id)}
                          className={`p-2 rounded-lg ${getThemeClass('hover:bg-zinc-600 text-zinc-400 hover:text-white', 'hover:bg-gray-200 text-gray-500 hover:text-gray-700')} transition-colors`}
                          title={apiKey.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}; 