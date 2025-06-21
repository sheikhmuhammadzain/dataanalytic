import React, { useState } from 'react';
import { useDataStore } from '../store/dataStore';
import { ArrowUpDown, Trash2, Calculator, Filter, RotateCcw, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  className?: string;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({ 
  children, 
  onClick = () => {}, 
  disabled = false,
  variant = 'default',
  className = "" 
}) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`${
      variant === 'danger' 
        ? 'bg-red-50 hover:bg-red-100 border-red-200' 
        : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
    } no-underline group cursor-pointer relative shadow-sm border rounded-full p-px text-xs font-semibold leading-6 ${
      variant === 'danger' ? 'text-red-700' : 'text-gray-700'
    } inline-block transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <span className="absolute inset-0 overflow-hidden rounded-full">
      <span className={`absolute inset-0 rounded-full ${
        variant === 'danger' 
          ? 'bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(239,68,68,0.1)_0%,rgba(239,68,68,0)_75%)]'
          : 'bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(59,130,246,0.1)_0%,rgba(59,130,246,0)_75%)]'
      } opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
    </span>
    <div className={`relative flex space-x-2 items-center z-10 rounded-full bg-white py-0.5 px-4 ring-1 ${
      variant === 'danger' 
        ? 'ring-red-200 group-hover:ring-red-300' 
        : 'ring-gray-200 group-hover:ring-blue-300'
    }`}>
      {children}
    </div>
    <span className={`absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r ${
      variant === 'danger'
        ? 'from-red-400/0 via-red-400/50 to-red-400/0'
        : 'from-blue-400/0 via-blue-400/50 to-blue-400/0'
    } transition-opacity duration-500 group-hover:opacity-40`} />
  </button>
);

interface TransformationHistoryItem {
  type: string;
  description: string;
  timestamp: Date;
}

export const DataTransformations: React.FC = () => {
  const { processedData, updateData, undoTransformation, redoTransformation } = useDataStore();
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterValue, setFilterValue] = useState('');
  const [transformationHistory, setTransformationHistory] = useState<TransformationHistoryItem[]>([]);

  if (!processedData) return null;

  const addToHistory = (type: string, description: string) => {
    setTransformationHistory(prev => [
      { type, description, timestamp: new Date() },
      ...prev
    ]);
  };

  const handleSort = () => {
    if (!selectedColumn) return;

    const sortedRows = [...processedData.rows].sort((a, b) => {
      const aVal = a[selectedColumn];
      const bVal = b[selectedColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    updateData(sortedRows);
    addToHistory('sort', `Sorted ${selectedColumn} ${sortOrder === 'asc' ? 'ascending' : 'descending'}`);
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleDeleteColumn = () => {
    if (!selectedColumn) return;

    const newRows = processedData.rows.map(row => {
      const { [selectedColumn]: _, ...rest } = row;
      return rest;
    });

    const newHeaders = processedData.headers.filter(h => h !== selectedColumn);
    updateData(newRows, newHeaders);
    addToHistory('delete', `Deleted column ${selectedColumn}`);
    setSelectedColumn('');
  };

  const handleCombineColumns = () => {
    if (!selectedColumn) return;

    const numericalColumns = processedData.summary.numericalColumns
      .filter(col => col !== selectedColumn);

    if (numericalColumns.length === 0) return;

    const newColumnName = `${selectedColumn}_combined`;
    const newRows = processedData.rows.map(row => ({
      ...row,
      [newColumnName]: numericalColumns.reduce((sum, col) => {
        const val = Number(row[col]) || 0;
        const baseVal = Number(row[selectedColumn]) || 0;
        return sum + baseVal + val;
      }, 0),
    }));

    updateData(newRows, [...processedData.headers, newColumnName]);
    addToHistory('combine', `Combined ${selectedColumn} with numerical columns`);
  };

  const handleFilter = () => {
    if (!selectedColumn || !filterValue) return;

    const filteredRows = processedData.rows.filter(row => {
      const value = row[selectedColumn];
      if (typeof value === 'number') {
        const numFilter = Number(filterValue);
        return !isNaN(numFilter) && value >= numFilter;
      }
      return String(value).toLowerCase().includes(filterValue.toLowerCase());
    });

    updateData(filteredRows);
    addToHistory('filter', `Filtered ${selectedColumn} with value ${filterValue}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="flex h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent appearance-none pr-8"
          >
            <option value="" className="bg-white text-gray-900">Select Column</option>
            {processedData.headers.map(header => (
              <option key={header} value={header} className="bg-white text-gray-900">{header}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="h-4 w-4 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>

        <div className="flex gap-3">
          <PremiumButton
            onClick={handleSort}
            disabled={!selectedColumn}
          >
            <ArrowUpDown className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-600" />
            <span className="text-gray-700 group-hover:text-blue-700">Sort {sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
          </PremiumButton>

          <PremiumButton
            onClick={handleDeleteColumn}
            disabled={!selectedColumn}
            variant="danger"
          >
            <Trash2 className="h-4 w-4 mr-2 text-red-500 group-hover:text-red-600" />
            <span className="text-red-700 group-hover:text-red-800">Delete Column</span>
          </PremiumButton>

          <PremiumButton
            onClick={handleCombineColumns}
            disabled={!selectedColumn}
          >
            <Calculator className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-600" />
            <span className="text-gray-700 group-hover:text-blue-700">Combine Columns</span>
          </PremiumButton>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Filter value..."
            className="flex h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <PremiumButton
            onClick={handleFilter}
            disabled={!selectedColumn || !filterValue}
          >
            <Filter className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-600" />
            <span className="text-gray-700 group-hover:text-blue-700">Apply Filter</span>
          </PremiumButton>
        </div>

        <div className="flex gap-3 ml-auto">
          <PremiumButton onClick={undoTransformation}>
            <RotateCcw className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-600" />
            <span className="text-gray-700 group-hover:text-blue-700">Undo</span>
          </PremiumButton>
          <PremiumButton onClick={redoTransformation}>
            <RotateCw className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-600" />
            <span className="text-gray-700 group-hover:text-blue-700">Redo</span>
          </PremiumButton>
        </div>
      </div>

      {transformationHistory.length > 0 && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transformation History</h3>
          <div className="space-y-2">
            {transformationHistory.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">{item.description}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 