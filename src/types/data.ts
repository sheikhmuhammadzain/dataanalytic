export interface DataRow {
  [key: string]: string | number;
}

export interface ColumnStats {
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  uniqueValues?: number;
  mostCommon?: { value: string | number; count: number }[];
}

export interface ProcessedData {
  headers: string[];
  rows: DataRow[];
  summary: {
    numericalColumns: string[];
    categoricalColumns: string[];
    rowCount: number;
    columnCount: number;
    columnStats: Record<string, ColumnStats>;
  };
}

export interface DataStore {
  rawData: DataRow[];
  processedData: ProcessedData | null;
  selectedColumns: string[];
  filterValue: string;
  setRawData: (data: DataRow[]) => void;
  processData: () => void;
  setSelectedColumns: (columns: string[]) => void;
  setFilterValue: (value: string) => void;
  getFilteredData: () => DataRow[];
}