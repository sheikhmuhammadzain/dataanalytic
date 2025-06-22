import React, { useRef, useState, useEffect } from "react";
import { Upload, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { useDataStore } from "../store/dataStore";

interface ProcessedRow {
  [key: string]: string | number | null;
}

type ParsedCSVRow = Record<string, string | number | null | undefined>;

// Accept onUploadStart and onUploadComplete as props
type FileUploadProps = {
  className?: string;
  onUploadStart: () => void;
  onUploadComplete: () => void;
};

const PROCESS_BATCH_SIZE = 10000; // Process data in smaller batches to yield control

export const FileUpload: React.FC<FileUploadProps> = ({
  className,
  onUploadStart,
  onUploadComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parserRef = useRef<any>(null);
  const setRawData = useDataStore((state) => state.setRawData);
  const processedData = useDataStore((state) => state.processedData);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Listen for theme changes
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
      if (currentTheme) {
        setTheme(currentTheme);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('themeChange', handleStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('themeChange', handleStorageChange as EventListener);
    };
  }, []);
  
  // Cleanup: Abort the parser if the component unmounts
  useEffect(() => {
    return () => {
      if (parserRef.current && typeof parserRef.current.abort === 'function') {
        parserRef.current.abort();
      }
    };
  }, []);

  const handleFileChange = async (newFiles: File[]) => {
    if (newFiles.length === 0) return;

    if(onUploadStart) onUploadStart();

    const file = newFiles[0];
    setIsLoading(true);
    setProgress(0);

    try {
      let rows: ProcessedRow[] = [];
      let lastProgressUpdate = performance.now();

      await new Promise((resolve, reject) => {
        const parserHandle = Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          worker: true, // Offload parsing to a web worker
          chunk: async (results) => {
            const { data, meta } = results;
            if (!Array.isArray(data) || data.length === 0) return;

            // Process data in batches
            for (let i = 0; i < data.length; i += PROCESS_BATCH_SIZE) {
              const batch = data.slice(i, i + PROCESS_BATCH_SIZE) as ParsedCSVRow[];
              const processedRows = batch.map((row: ParsedCSVRow) => {
                const processedRow: ProcessedRow = {};
                Object.entries(row).forEach(([key, value]) => {
                  if (typeof value === "string") {
                    // Use regex to quickly detect common date formats (e.g., YYYY-MM-DD)
                    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
                    if (dateRegex.test(value)) {
                      const date = new Date(value);
                      processedRow[key] = !isNaN(date.getTime()) ? date.getTime() : value;
                    } else {
                      processedRow[key] = value;
                    }
                  } else if (value === null || value === undefined) {
                    processedRow[key] = null;
                  } else {
                    processedRow[key] = value as number;
                  }
                });
                return processedRow;
              });
              rows = rows.concat(processedRows);
              // Yield to the event loop to avoid UI blocking
              await new Promise(res => setTimeout(res, 0));
            }

            // Throttle progress updates
            const now = performance.now();
            const processedBytes = meta.cursor || 0;
            const totalBytes = file.size;
            const newProgress = Math.round((processedBytes / totalBytes) * 100);
            if (now - lastProgressUpdate > 100) {
              setProgress(newProgress);
              lastProgressUpdate = now;
            }
          },
          complete: () => {
            queueMicrotask(() => {
              setRawData(rows, file.name);
              if(onUploadComplete) onUploadComplete();
              resolve(true);
            });
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
            reject(error);
          },
        });
        parserRef.current = parserHandle;
      });
    } catch (error) {
      console.error("Error processing CSV:", error);
      alert("Error processing CSV file. Please check the format and try again.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };



  // Helper function for theme-based classes
  const getThemeClass = (darkClass: string, lightClass: string) => {
    return theme === 'dark' ? darkClass : lightClass;
  };

  if (processedData) {
    return (
      <div className="flex justify-center">
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${getThemeClass('bg-indigo-500/20 hover:bg-indigo-500/30 text-white/90', 'bg-blue-50 hover:bg-blue-100 text-[#0052A5]')} h-10 px-4 py-2`}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Upload className={`h-5 w-5 mr-2 ${getThemeClass('text-white/90', 'text-[#0052A5]')}`} />
          )}
          {isLoading ? "Processing..." : "Select Files"}
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) =>
              handleFileChange(Array.from(e.target.files || []))
            }
            className="hidden"
            accept=".csv"
          />
        </button>
      </div>
    );
  }

  // When used in AdminPanel, just render the button
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={className || `px-6 py-3 font-medium ${getThemeClass('bg-white text-black hover:bg-gray-100', 'bg-gray-900 text-white hover:bg-gray-800')} rounded-lg transition-colors disabled:opacity-50`}
    >
      {isLoading ? "Processing..." : "Select Files"}
      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) =>
          handleFileChange(Array.from(e.target.files || []))
        }
        className="hidden"
        accept=".csv"
      />
    </button>
  );


};

export function GridPattern({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const columns = 41;
  const rows = 11;
  return (
    <div className={`flex ${theme === 'dark' ? 'bg-white/5' : 'bg-blue-50/30'} backdrop-blur-lg flex-shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105`}>
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex flex-shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? theme === 'dark' ? "bg-white/5" : "bg-blue-50/50"
                  : theme === 'dark' 
                    ? "bg-white/5 shadow-[0px_0px_1px_3px_rgba(99,102,241,0.1)_inset]" 
                    : "bg-blue-50/50 shadow-[0px_0px_1px_3px_rgba(0,82,165,0.05)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}
