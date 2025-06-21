import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "../lib/utils";
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

const mainVariant = {
  initial: { x: 0, y: 0 },
  animate: { x: 20, y: -20, opacity: 0.9 },
};

const secondaryVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

const PARSE_CHUNK_SIZE = 50000; // Not directly used by Papa.parse but indicative
const PROCESS_BATCH_SIZE = 10000; // Process data in smaller batches to yield control

export const FileUpload: React.FC<FileUploadProps> = ({
  className,
  onUploadStart,
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parserRef = useRef<any>(null);
  const setRawData = useDataStore((state) => state.setRawData);
  const processedData = useDataStore((state) => state.processedData);
  const [uploadComplete, setUploadComplete] = useState(false);
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
    setFiles([file]);
    setIsLoading(true);
    setProgress(0);
    setUploadComplete(false);

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
            setUploadComplete(true);
            queueMicrotask(() => {
              setRawData(rows);
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

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    accept: { "text/csv": [".csv"] },
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
      alert("Please upload a valid CSV file.");
    },
  });

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
          {isLoading ? "Processing..." : "Upload New CSV"}
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

  if (uploadComplete && !processedData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={`${getThemeClass('bg-white/10', 'bg-white')} backdrop-blur-xl p-8 rounded-2xl border ${getThemeClass('border-indigo-500/20', 'border-[#0052A5]/20')} text-center`}>
          <Loader2 className={`h-8 w-8 animate-spin mx-auto ${getThemeClass('text-indigo-400', 'text-[#0052A5]')}`} />
          <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-800')} mt-4`}>
            Processing Data
          </h3>
          <p className={`${getThemeClass('text-white/60', 'text-gray-600')} mt-2`}>
            Preparing your visualizations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className={cn(
          `p-10 group/file block rounded-2xl cursor-pointer w-full relative overflow-hidden border ${getThemeClass('border-indigo-500/20 bg-white/5', 'border-[#0052A5]/20 bg-white')} backdrop-blur-lg`,
          isLoading && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) =>
            handleFileChange(Array.from(e.target.files || []))
          }
          className="hidden"
          accept=".csv"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern theme={theme} />
        </div>
        <div className="flex flex-col items-center justify-center relative z-10">
          {isLoading ? (
            <>
              <div className="relative">
                <div className={`absolute inset-0 rounded-full blur-sm ${getThemeClass('bg-indigo-500/30', 'bg-[#0052A5]/30')}`} />
                <Loader2 className={`h-12 w-12 ${getThemeClass('text-white', 'text-[#0052A5]')} animate-spin`} />
              </div>
              <p className={`${getThemeClass('text-white/90', 'text-gray-800')} text-lg font-medium mt-4`}>
                Processing CSV...
              </p>
              <p className={`${getThemeClass('text-white/60', 'text-gray-600')} text-sm mt-1`}>
                This may take a moment
              </p>
              {progress > 0 && (
                <div className="w-full max-w-xs mt-4">
                  <div className={`h-1 ${getThemeClass('bg-white/10', 'bg-gray-200')} rounded-full overflow-hidden`}>
                    <div
                      className={`h-full ${getThemeClass('bg-indigo-500', 'bg-[#0052A5]')} transition-all duration-300`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className={`${getThemeClass('text-white/50', 'text-gray-500')} text-xs mt-2 text-center`}>
                    {progress}% processed
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <Upload className={`h-12 w-12 ${getThemeClass('text-white/80', 'text-[#0052A5]')} mb-4`} />
              <p className={`relative z-20 font-sans font-bold ${getThemeClass('text-white', 'text-gray-800')} text-xl`}>
                Upload CSV File
              </p>
              <p className={`relative z-20 font-sans font-normal ${getThemeClass('text-white/60', 'text-gray-600')} text-base mt-2`}>
                Drag and drop your CSV file here or click to browse
              </p>
            </>
          )}
          <div className="relative w-full mt-10 max-w-xl mx-auto">
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={"file" + idx}
                  layoutId={
                    idx === 0 ? "file-upload" : "file-upload-" + idx
                  }
                  className={cn(
                    `relative overflow-hidden z-40 ${getThemeClass('bg-white/10', 'bg-blue-50')} backdrop-blur-lg flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-xl border ${getThemeClass('border-indigo-500/20', 'border-[#0052A5]/20')}`
                  )}
                >
                  <div className="flex justify-between w-full items-center gap-4">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className={`text-base ${getThemeClass('text-white', 'text-gray-800')} truncate max-w-xs`}
                    >
                      {file.name}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className={`rounded-lg px-2 py-1 w-fit flex-shrink-0 text-sm ${getThemeClass('text-white/80 bg-white/10', 'text-gray-700 bg-blue-100')} backdrop-blur-lg`}
                    >
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.p>
                  </div>
                  <div className={`flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between ${getThemeClass('text-white/60', 'text-gray-600')}`}>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className={`px-2 py-1 rounded-lg ${getThemeClass('bg-white/10', 'bg-blue-100')} backdrop-blur-lg`}
                    >
                      {file.type || "text/csv"}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                    >
                      modified{" "}
                      {new Date(file.lastModified).toLocaleDateString()}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  `relative group-hover/file:shadow-2xl z-40 ${getThemeClass('bg-white/10', 'bg-blue-50')} backdrop-blur-lg flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-xl border ${getThemeClass('border-indigo-500/20', 'border-[#0052A5]/20')}`,
                  `${getThemeClass('shadow-[0px_10px_50px_rgba(99,102,241,0.1)]', 'shadow-[0px_10px_50px_rgba(0,82,165,0.1)]')}`
                )}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`${getThemeClass('text-white/80', 'text-[#0052A5]')} flex flex-col items-center`}
                  >
                    Drop it
                    <Upload className={`h-4 w-4 ${getThemeClass('text-white/80', 'text-[#0052A5]')} mt-2`} />
                  </motion.p>
                ) : (
                  <Upload className={`h-6 w-6 ${getThemeClass('text-white/80', 'text-[#0052A5]')}`} />
                )}
              </motion.div>
            )}
            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className={`absolute opacity-0 border border-dashed ${getThemeClass('border-indigo-500', 'border-[#0052A5]')} inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-xl`}
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
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
