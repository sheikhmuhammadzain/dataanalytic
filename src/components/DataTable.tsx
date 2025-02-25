import React, { useState, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({ 
  children, 
  onClick = () => {}, 
  disabled = false,
  className = "" 
}) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`bg-slate-800 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <span className="absolute inset-0 overflow-hidden rounded-full">
      <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </span>
    <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10">
      {children}
    </div>
    <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40" />
  </button>
);

interface DataTableProps {
  showFilters: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ showFilters }) => {
  const processedData = useDataStore(state => state.processedData);
  const filterValue = useDataStore(state => state.filterValue);
  const setFilterValue = useDataStore(state => state.setFilterValue);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    column: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  // Debug effect to check data loading
  useEffect(() => {
    if (processedData) {
      console.log("DataTable: Data loaded successfully", {
        rows: processedData.rows.length,
        headers: processedData.headers,
      });
    } else {
      console.log("DataTable: No data available");
    }
  }, [processedData]);
  
  // Sync local search term with global filter value
  useEffect(() => {
    setSearchTerm(filterValue);
  }, [filterValue]);
  
  if (!processedData) return null;

  const rowsPerPage = 10;
  
  // Apply filtering locally for better control
  const applyFilters = () => {
    if (!processedData?.rows) return [];
    
    const terms = searchTerm.toLowerCase().split(" ").filter(Boolean);
    if (!terms.length) return processedData.rows;
    
    return processedData.rows.filter(row => 
      terms.every(term => {
        // If a column is selected, only search in that column
        if (selectedColumn) {
          const value = row[selectedColumn];
          if (value == null) return false;
          return String(value).toLowerCase().includes(term);
        }
        
        // Otherwise search in all columns
        return Object.entries(row).some(([key, value]) => {
          if (value == null) return false;
          return String(value).toLowerCase().includes(term);
        });
      })
    );
  };
  
  const filteredData = applyFilters();
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setFilterValue(value);
  };

  const handleSort = (column: string) => {
    setSortConfig(current => ({
      column,
      direction: current?.column === column && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.column];
      const bVal = b[sortConfig.column];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortConfig]);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-4">
      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 mb-6"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search in data..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-indigo-500/20 rounded-lg text-white/90 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="bg-white/5 border border-indigo-500/20 rounded-lg text-white/90 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">All Columns</option>
            {processedData.headers.map(header => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
        </motion.div>
      )}

      <div className="overflow-hidden rounded-lg border border-white/[0.2] bg-black/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          {processedData.rows.length > 0 ? (
            <table className="w-full min-w-full divide-y divide-white/[0.2]">
              <thead className="bg-white/5">
                <tr>
                  {processedData.headers.map((header, index) => (
                    <th
                      key={index}
                      onClick={() => handleSort(header)}
                      className="px-6 py-4 text-left text-sm font-semibold text-white/90 whitespace-nowrap cursor-pointer hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        {header}
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.2]">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, rowIndex) => (
                    <tr 
                      key={rowIndex}
                      className="hover:bg-white/5 transition-colors"
                    >
                      {processedData.headers.map((header, colIndex) => (
                        <td
                          key={`${rowIndex}-${colIndex}`}
                          className="px-6 py-4 text-sm text-white/70 whitespace-nowrap"
                        >
                          {row[header] === null || row[header] === undefined ? '-' : String(row[header])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td 
                      colSpan={processedData.headers.length}
                      className="px-6 py-8 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-3 py-6">
                        <Search className="h-8 w-8 text-white/20" />
                        <div className="space-y-1">
                          <h4 className="text-base font-medium text-white/90">No matching results</h4>
                          <p className="text-xs text-white/50">
                            Try adjusting your search terms or filters to find what you're looking for
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center justify-center gap-4">
                <Search className="h-12 w-12 text-white/20" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white/90">No data available</h3>
                  <p className="text-sm text-white/50 max-w-md mx-auto">
                    Upload a CSV file using the upload button in the navigation bar to see your data displayed here.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-white/50">
            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
          </p>
          <div className="flex items-center gap-2">
            <PremiumButton
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </PremiumButton>
            <span className="text-white/70 text-sm px-4">
              Page {currentPage} of {totalPages || 1}
            </span>
            <PremiumButton
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </PremiumButton>
          </div>
        </div>
      )}
    </div>
  );
};