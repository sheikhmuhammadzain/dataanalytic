import { create } from "zustand";
import { mean, median, deviation } from "d3-array";

interface ColumnStats {
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
}

interface DataSummary {
  rowCount: number;
  columnCount: number;
  headers: string[];
  numericalColumns: string[];
  categoricalColumns: string[];
  columnStats: Record<string, ColumnStats>;
}

interface ProcessedData {
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

interface DataStore {
  rawData: Record<string, string | number | null>[] | null;
  processedData: ProcessedData | null;
  filterValue: string;
  selectedColumns: string[];
  transformationHistory: DataTransformation[];
  currentHistoryIndex: number;
  isProcessing: boolean;
  error: string | null;
  setRawData: (data: Record<string, string | number | null>[]) => void;
  setFilterValue: (value: string) => void;
  setSelectedColumns: (columns: string[]) => void;
  getFilteredData: () => Record<string, string | number | null>[];
  updateData: (rows: Record<string, string | number | null>[], headers?: string[]) => void;
  undoTransformation: () => void;
  redoTransformation: () => void;
  resetError: () => void;
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

  // Initialize numerical values arrays
  headers.forEach(header => {
    numericalValues[header] = [];
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
        if (columnTypes.get(header) === "numerical") {
          const value = row[header];
          if (typeof value === "number" && !isNaN(value)) {
            numericalValues[header].push(value);
          }
        }
      });
    }

    // Allow UI to update by yielding to event loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  // Calculate statistics for numerical columns
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
        };
      }
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

export const useDataStore = create<DataStore>((set, get) => ({
  rawData: null,
  processedData: null,
  filterValue: "",
  selectedColumns: [],
  transformationHistory: [],
  currentHistoryIndex: -1,
  isProcessing: false,
  error: null,
  setRawData: (data) => {
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

    return processedData.rows.filter((row) =>
      searchTerms.every((term) =>
        selectedColumns.some((col) => {
          const value = row[col];
          if (value == null) return false;
          return String(value).toLowerCase().includes(term);
        })
      )
    );
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
  resetError: () => set({ error: null })
}));
