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
    className={`bg-gray-100 hover:bg-gray-200 no-underline group cursor-pointer relative shadow-sm border border-gray-200 rounded-full p-px text-xs font-semibold leading-6 text-gray-700 inline-block transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <span className="absolute inset-0 overflow-hidden rounded-full">
      <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(59,130,246,0.1)_0%,rgba(59,130,246,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </span>
    <div className="relative flex space-x-2 items-center z-10 rounded-full bg-white py-0.5 px-4 ring-1 ring-gray-200 group-hover:ring-blue-300">
      {children}
    </div>
    <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-blue-400/0 via-blue-400/50 to-blue-400/0 transition-opacity duration-500 group-hover:opacity-40" />
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search in data..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg text-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Columns</option>
            {processedData.headers.map(header => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
        </motion.div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {processedData.rows.length > 0 ? (
            <table className="w-full min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {processedData.headers.map((header, index) => (
                    <th
                      key={index}
                      onClick={() => handleSort(header)}
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        {header}
                        <ArrowUpDown className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, rowIndex) => (
                    <tr 
                      key={rowIndex}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {processedData.headers.map((header, colIndex) => (
                        <td
                          key={`${rowIndex}-${colIndex}`}
                          className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap"
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
                        <Search className="h-8 w-8 text-gray-300" />
                        <div className="space-y-1">
                          <h4 className="text-base font-medium text-gray-900">No matching results</h4>
                          <p className="text-xs text-gray-500">
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
                <Search className="h-12 w-12 text-gray-300" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">No data available</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
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
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
          </p>
          <div className="flex items-center gap-2">
            <PremiumButton
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1 text-gray-500 group-hover:text-blue-600" />
              <span className="text-gray-700 group-hover:text-blue-700">Previous</span>
            </PremiumButton>
            <span className="text-gray-600 text-sm px-4">
              Page {currentPage} of {totalPages || 1}
            </span>
            <PremiumButton
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              <span className="text-gray-700 group-hover:text-blue-700">Next</span>
              <ChevronRight className="h-4 w-4 ml-1 text-gray-500 group-hover:text-blue-600" />
            </PremiumButton>
          </div>
        </div>
      )}
    </div>
  );
};