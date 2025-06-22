import { create } from "zustand";
import { mean, median, deviation } from "d3-array";

interface ColumnStats {
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  // Categorical statistics
  uniqueValues?: number;
  valueCounts?: Record<string, number>;
  mostCommon?: Array<{ value: string; count: number; percentage: number }>;
  totalCount?: number;
}

interface DataSummary {
  rowCount: number;
  columnCount: number;
  headers: string[];
  numericalColumns: string[];
  categoricalColumns: string[];
  columnStats: Record<string, ColumnStats>;
}

export interface ProcessedData {
  rows: Record<string, string | number | null>[];
  headers: string[];
  summary: DataSummary;
}

interface DataTransformation {
  type: string;
  description: string;
  timestamp: Date;
  data: ProcessedData;
}

interface UploadedFile {
  id: string;
  name: string;
  uploadDate: string;
  rowCount: number;
  columnCount: number;
  size: string;
  type: string;
}

export interface GeneratedReport {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  fileName: string;
  format: 'pdf' | 'html' | 'txt';
  generatedDate: string;
  dataRowCount: number;
  dataColumnCount: number;
  size?: string;
  status: 'success' | 'failed';
}

interface DataStore {
  rawData: Record<string, string | number | null>[] | null;
  processedData: ProcessedData | null;
  filterValue: string;
  selectedColumns: string[];
  transformationHistory: DataTransformation[];
  currentHistoryIndex: number;
  isProcessing: boolean;
  error: string | null;
  // Authentication state
  isAuthenticated: boolean;
  user: { email: string; role: string } | null;
  // File tracking
  uploadedFiles: UploadedFile[];
  generatedReports: GeneratedReport[];
  showAdminPanel: boolean;
  setRawData: (data: Record<string, string | number | null>[], fileName?: string) => void;
  setFilterValue: (value: string) => void;
  setSelectedColumns: (columns: string[]) => void;
  getFilteredData: () => Record<string, string | number | null>[];
  updateData: (rows: Record<string, string | number | null>[], headers?: string[]) => void;
  undoTransformation: () => void;
  redoTransformation: () => void;
  resetError: () => void;
  // Authentication methods
  login: (email: string, password: string) => boolean;
  logout: () => void;
  // Admin panel methods
  setShowAdminPanel: (show: boolean) => void;
  addUploadedFile: (file: UploadedFile) => void;
  getUploadedFiles: () => UploadedFile[];
  // Report management methods
  addGeneratedReport: (report: GeneratedReport) => void;
  getGeneratedReports: () => GeneratedReport[];
  deleteGeneratedReport: (reportId: string) => void;
}

const CHUNK_SIZE = 10000; // Process data in chunks of 10k rows
const SAMPLE_SIZE = 1000; // Sample size for column type detection

const processDataInChunks = async (
  rawData: Record<string, string | number | null>[]
): Promise<ProcessedData | null> => {
  if (!rawData || rawData.length === 0) return null;

  const headers = Object.keys(rawData[0]);
  const columnTypes = new Map<string, "numerical" | "categorical">();
  const numericalValues: Record<string, number[]> = {};
  const categoricalValues: Record<string, Record<string, number>> = {};

  // Initialize arrays/maps for data collection
  headers.forEach(header => {
    numericalValues[header] = [];
    categoricalValues[header] = {};
  });

  // Sample first chunk for column type detection
  const sampleSize = Math.min(SAMPLE_SIZE, rawData.length);
  const sampleData = rawData.slice(0, sampleSize);

  // Determine column types from sample
  headers.forEach((header) => {
    let numericCount = 0;
    for (const row of sampleData) {
      const value = row[header];
      if (typeof value === "number" && !isNaN(value)) {
        numericCount++;
      }
    }
    if (numericCount >= 0.7 * sampleSize) {
      columnTypes.set(header, "numerical");
    } else {
      columnTypes.set(header, "categorical");
    }
  });

  // Process data in chunks
  const totalChunks = Math.ceil(rawData.length / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, rawData.length);
    const chunk = rawData.slice(start, end);

    // Process chunk
    for (const row of chunk) {
      headers.forEach((header) => {
        const value = row[header];
        
        if (columnTypes.get(header) === "numerical") {
          if (typeof value === "number" && !isNaN(value)) {
            numericalValues[header].push(value);
          }
        } else {
          // Categorical column - count values
          const stringValue = value !== null && value !== undefined ? String(value) : 'null';
          categoricalValues[header][stringValue] = (categoricalValues[header][stringValue] || 0) + 1;
        }
      });
    }

    // Allow UI to update by yielding to event loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  // Calculate statistics for all columns
  const columnStats: Record<string, ColumnStats> = {};
  
  headers.forEach((header) => {
    if (columnTypes.get(header) === "numerical") {
      const values = numericalValues[header];
      if (values.length > 0) {
        columnStats[header] = {
          min: Math.min(...values),
          max: Math.max(...values),
          mean: mean(values),
          median: median(values),
          stdDev: deviation(values),
          totalCount: values.length
        };
      }
    } else {
      // Categorical statistics
      const valueCounts = categoricalValues[header];
      const totalCount = Object.values(valueCounts).reduce((sum, count) => sum + count, 0);
      const uniqueValues = Object.keys(valueCounts).length;
      
      // Sort by count descending and get top values
      const sortedEntries = Object.entries(valueCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Top 10 most common values
      
      const mostCommon = sortedEntries.map(([value, count]) => ({
        value,
        count,
        percentage: (count / totalCount) * 100
      }));
      
      columnStats[header] = {
        uniqueValues,
        valueCounts,
        mostCommon,
        totalCount
      };
    }
  });

  const numericalColumns = headers.filter(h => columnTypes.get(h) === "numerical");
  const categoricalColumns = headers.filter(h => columnTypes.get(h) === "categorical");

  return {
    rows: rawData,
    headers,
    summary: {
      rowCount: rawData.length,
      columnCount: headers.length,
      headers,
      numericalColumns,
      categoricalColumns,
      columnStats,
    },
  };
};

// localStorage helper functions
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

export const useDataStore = create<DataStore>((set, get) => ({
  rawData: null,
  processedData: null,
  filterValue: "",
  selectedColumns: [],
  transformationHistory: [],
  currentHistoryIndex: -1,
  isProcessing: false,
  error: null,
  // Authentication state
  isAuthenticated: loadFromLocalStorage('isAuthenticated', false),
  user: loadFromLocalStorage('user', null),
  // File tracking
  uploadedFiles: loadFromLocalStorage('uploadedFiles', []),
  generatedReports: loadFromLocalStorage('generatedReports', []),
  showAdminPanel: loadFromLocalStorage('showAdminPanel', false),
  setRawData: (data, fileName) => {
    if (!data || data.length === 0) {
      set({ 
        rawData: null, 
        processedData: null, 
        selectedColumns: [],
        transformationHistory: [],
        currentHistoryIndex: -1,
        error: null 
      });
      return;
    }

    set({ isProcessing: true, error: null });

    // Use async processing
    processDataInChunks(data)
      .then((processed) => {
        if (processed) {
          // Add uploaded file to records if fileName is provided
          if (fileName) {
            const newFile: UploadedFile = {
              id: Date.now().toString(),
              name: fileName,
              uploadDate: new Date().toISOString(),
              rowCount: processed.summary.rowCount,
              columnCount: processed.summary.columnCount,
              size: `${Math.round(data.length * 0.001)}KB`, // Rough estimate
              type: 'CSV'
            };
            
            const currentFiles = get().uploadedFiles;
            const updatedFiles = [newFile, ...currentFiles];
            saveToLocalStorage('uploadedFiles', updatedFiles);
            
            set({
              rawData: data,
              processedData: processed,
              selectedColumns: processed.headers,
              transformationHistory: [{
                type: 'initial',
                description: 'Initial data load',
                timestamp: new Date(),
                data: processed
              }],
              currentHistoryIndex: 0,
              isProcessing: false,
              error: null,
              uploadedFiles: updatedFiles,
              showAdminPanel: false
            });
            
            // Also save showAdminPanel state to localStorage
            saveToLocalStorage('showAdminPanel', false);
          } else {
            set({
              rawData: data,
              processedData: processed,
              selectedColumns: processed.headers,
              transformationHistory: [{
                type: 'initial',
                description: 'Initial data load',
                timestamp: new Date(),
                data: processed
              }],
              currentHistoryIndex: 0,
              isProcessing: false,
              error: null
            });
          }
        }
      })
      .catch((error) => {
        set({ 
          isProcessing: false, 
          error: error instanceof Error ? error.message : 'Error processing data' 
        });
      });
  },
  setFilterValue: (value) => set({ filterValue: value }),
  setSelectedColumns: (columns) => set({ selectedColumns: columns }),
  getFilteredData: () => {
    const { processedData, filterValue, selectedColumns } = get();
    if (!processedData?.rows) return [];

    const searchTerms = filterValue
      .toLowerCase()
      .split(" ")
      .filter(Boolean);
    
    if (!searchTerms.length) return processedData.rows;

    // Enhanced filtering to check all columns if selectedColumns is empty
    // Otherwise only check the selected columns
    return processedData.rows.filter((row) => {
      return searchTerms.every((term) => {
        // If no columns are selected, search all columns
        if (selectedColumns.length === 0) {
          return Object.entries(row).some(([, value]) => {
            if (value == null) return false;
            return String(value).toLowerCase().includes(term);
          });
        }
        
        // Otherwise only search in selected columns
        return selectedColumns.some((col) => {
          const value = row[col];
          if (value == null) return false;
          return String(value).toLowerCase().includes(term);
        });
      });
    });
  },
  updateData: async (rows, headers) => {
    const { processedData, transformationHistory, currentHistoryIndex } = get();
    if (!processedData) return;

    try {
      const newProcessedData = await processDataInChunks(rows);
      if (!newProcessedData) return;

      if (headers) {
        newProcessedData.headers = headers;
      }

      // Truncate future history if we're not at the latest state
      const newHistory = transformationHistory.slice(0, currentHistoryIndex + 1);
      newHistory.push({
        type: 'update',
        description: 'Data transformation applied',
        timestamp: new Date(),
        data: newProcessedData
      });

      set({
        processedData: newProcessedData,
        transformationHistory: newHistory,
        currentHistoryIndex: newHistory.length - 1,
        error: null
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error updating data' 
      });
    }
  },
  undoTransformation: () => {
    const { transformationHistory, currentHistoryIndex } = get();
    if (currentHistoryIndex <= 0) return;

    const previousState = transformationHistory[currentHistoryIndex - 1];
    set({
      processedData: previousState.data,
      currentHistoryIndex: currentHistoryIndex - 1,
      error: null
    });
  },
  redoTransformation: () => {
    const { transformationHistory, currentHistoryIndex } = get();
    if (currentHistoryIndex >= transformationHistory.length - 1) return;

    const nextState = transformationHistory[currentHistoryIndex + 1];
    set({
      processedData: nextState.data,
      currentHistoryIndex: currentHistoryIndex + 1,
      error: null
    });
  },
  resetError: () => set({ error: null }),
  // Authentication methods
  login: (email: string, password: string) => {
    // Demo credentials
    if (email === 'admin@qubit.com' && password === 'admin123') {
      const authState = { 
        isAuthenticated: true, 
        user: { email, role: 'admin' },
        showAdminPanel: true
      };
      
      // Save to localStorage
      saveToLocalStorage('isAuthenticated', true);
      saveToLocalStorage('user', { email, role: 'admin' });
      saveToLocalStorage('showAdminPanel', true);
      
      set(authState);
      return true;
    }
    return false;
  },
  logout: () => {
    // Clear localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('showAdminPanel');
    
    set({ 
      isAuthenticated: false, 
      user: null,
      rawData: null,
      processedData: null,
      selectedColumns: [],
      transformationHistory: [],
      currentHistoryIndex: -1,
      filterValue: "",
      error: null,
      showAdminPanel: false
    });
  },
  // Admin panel methods
  setShowAdminPanel: (show: boolean) => {
    saveToLocalStorage('showAdminPanel', show);
    set({ showAdminPanel: show });
  },
  addUploadedFile: (file: UploadedFile) => {
    const currentFiles = get().uploadedFiles;
    const updatedFiles = [file, ...currentFiles];
    saveToLocalStorage('uploadedFiles', updatedFiles);
    set({ uploadedFiles: updatedFiles });
  },
  getUploadedFiles: () => {
    return get().uploadedFiles;
  },
  // Report management methods
  addGeneratedReport: (report: GeneratedReport) => {
    const currentReports = get().generatedReports;
    const updatedReports = [report, ...currentReports];
    saveToLocalStorage('generatedReports', updatedReports);
    set({ generatedReports: updatedReports });
  },
  getGeneratedReports: () => {
    return get().generatedReports;
  },
  deleteGeneratedReport: (reportId: string) => {
    const currentReports = get().generatedReports;
    const updatedReports = currentReports.filter(report => report.id !== reportId);
    saveToLocalStorage('generatedReports', updatedReports);
    set({ generatedReports: updatedReports });
  }
}));
