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
    className={`bg-slate-800 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block disabled:opacity-50 disabled:cursor-not-allowed ${
      variant === 'danger' ? 'hover:bg-red-500/20' : ''
    } ${className}`}
  >
    <span className="absolute inset-0 overflow-hidden rounded-full">
      <span className={`absolute inset-0 rounded-full ${
        variant === 'danger' 
          ? 'bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(239,68,68,0.6)_0%,rgba(239,68,68,0)_75%)]'
          : 'bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)]'
      } opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
    </span>
    <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10">
      {children}
    </div>
    <span className={`absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r ${
      variant === 'danger'
        ? 'from-red-400/0 via-red-400/90 to-red-400/0'
        : 'from-emerald-400/0 via-emerald-400/90 to-emerald-400/0'
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
            className="flex h-10 rounded-lg border border-indigo-500/20 bg-black/40 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 appearance-none pr-8"
          >
            <option value="" className="bg-black text-white">Select Column</option>
            {processedData.headers.map(header => (
              <option key={header} value={header} className="bg-black text-white">{header}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="h-4 w-4 text-white/70"
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
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Sort {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </PremiumButton>

          <PremiumButton
            onClick={handleDeleteColumn}
            disabled={!selectedColumn}
            variant="danger"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Column
          </PremiumButton>

          <PremiumButton
            onClick={handleCombineColumns}
            disabled={!selectedColumn}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Combine Columns
          </PremiumButton>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Filter value..."
            className="flex h-10 rounded-lg border border-indigo-500/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <PremiumButton
            onClick={handleFilter}
            disabled={!selectedColumn || !filterValue}
          >
            <Filter className="h-4 w-4 mr-2" />
            Apply Filter
          </PremiumButton>
        </div>

        <div className="flex gap-3 ml-auto">
          <PremiumButton onClick={undoTransformation}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Undo
          </PremiumButton>
          <PremiumButton onClick={redoTransformation}>
            <RotateCw className="h-4 w-4 mr-2" />
            Redo
          </PremiumButton>
        </div>
      </div>

      {transformationHistory.length > 0 && (
        <div className="mt-8 rounded-lg border border-indigo-500/20 bg-white/5 p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Transformation History</h3>
          <div className="space-y-2">
            {transformationHistory.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 rounded-lg bg-black/40 backdrop-blur-sm border border-indigo-500/10"
              >
                <div className="flex items-center gap-2">
                  <span className="text-white/90">{item.description}</span>
                </div>
                <span className="text-sm text-white/50">
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