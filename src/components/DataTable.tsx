import React, { useState } from 'react';
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
  const { processedData, getFilteredData } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    column: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  if (!processedData) return null;

  const rowsPerPage = 10;
  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    useDataStore.getState().setFilterValue(value);
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
              {paginatedData.map((row, rowIndex) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
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
            Page {currentPage} of {totalPages}
          </span>
          <PremiumButton
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </PremiumButton>
        </div>
      </div>
    </div>
  );
};