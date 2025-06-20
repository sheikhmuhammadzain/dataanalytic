import React from 'react';
import { useDataStore } from '../store/dataStore';
import { BarChart3, Hash, TrendingUp, Target, Calendar, User, Building, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

// Icon mapping for common column types
const getColumnIcon = (columnName: string, isNumerical: boolean) => {
  const name = columnName.toLowerCase();
  
  if (name.includes('date') || name.includes('time')) return Calendar;
  if (name.includes('status') || name.includes('state')) return Target;
  if (name.includes('department') || name.includes('dept')) return Building;
  if (name.includes('name') || name.includes('contact')) return User;
  if (name.includes('subject') || name.includes('title')) return FileText;
  if (isNumerical) return TrendingUp;
  
  return Hash;
};

export const ColumnStatistics: React.FC = () => {
  const processedData = useDataStore(state => state.processedData);

  if (!processedData) return null;

  const { columnStats, numericalColumns, categoricalColumns } = processedData.summary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Object.entries(columnStats).map(([column, stats], index) => {
        const isNumerical = numericalColumns.includes(column);
        const IconComponent = getColumnIcon(column, isNumerical);
        
        return (
          <motion.div
            key={column}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border border-zinc-700/50 rounded-xl p-6 shadow-lg backdrop-blur-sm hover:border-zinc-600/50 transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${isNumerical ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white truncate" title={column}>
                  {column}
                </h3>
                <p className={`text-xs font-medium ${isNumerical ? 'text-blue-400' : 'text-purple-400'}`}>
                  {isNumerical ? 'Numerical' : 'Categorical'}
                </p>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              {isNumerical ? (
                // Numerical Statistics
                <>
                  {stats.min !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Minimum:</span>
                      <span className="text-sm font-semibold text-green-400">
                        {typeof stats.min === 'number' ? stats.min.toLocaleString() : stats.min}
                      </span>
                    </div>
                  )}
                  {stats.max !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Maximum:</span>
                      <span className="text-sm font-semibold text-red-400">
                        {typeof stats.max === 'number' ? stats.max.toLocaleString() : stats.max}
                      </span>
                    </div>
                  )}
                  {stats.mean !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Average:</span>
                      <span className="text-sm font-semibold text-blue-400">
                        {stats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {stats.median !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Median:</span>
                      <span className="text-sm font-semibold text-indigo-400">
                        {stats.median.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {stats.stdDev !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Std Dev:</span>
                      <span className="text-sm font-semibold text-yellow-400">
                        {stats.stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {stats.totalCount !== undefined && (
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-700/50">
                      <span className="text-sm text-zinc-400">Total Count:</span>
                      <span className="text-sm font-semibold text-zinc-200">
                        {stats.totalCount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                // Categorical Statistics
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Unique Values:</span>
                    <span className="text-sm font-semibold text-purple-400">
                      {stats.uniqueValues?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  
                  {stats.totalCount !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Total Count:</span>
                      <span className="text-sm font-semibold text-zinc-200">
                        {stats.totalCount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Most Common Values */}
                  {stats.mostCommon && stats.mostCommon.length > 0 && (
                    <div className="pt-3 border-t border-zinc-700/50">
                      <p className="text-sm font-medium text-zinc-300 mb-3">Most Common:</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
                        {stats.mostCommon.slice(0, 5).map(({ value, count, percentage }, idx) => (
                          <div key={`${value}-${idx}`} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-zinc-400 truncate max-w-[120px]" title={value}>
                                {value}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-green-400">
                                  {count.toLocaleString()}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-zinc-700/50 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        
                        {/* Show if there are more values */}
                        {stats.uniqueValues && stats.uniqueValues > 5 && (
                          <div className="text-xs text-zinc-500 pt-1 border-t border-zinc-700/30">
                            +{stats.uniqueValues - 5} more values
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Special handling for status-like columns */}
                  {(column.toLowerCase().includes('status') || column.toLowerCase().includes('state')) && 
                   stats.valueCounts && (
                    <div className="pt-3 border-t border-zinc-700/50">
                      <p className="text-sm font-medium text-zinc-300 mb-2">Status Breakdown:</p>
                      <div className="space-y-1">
                        {Object.entries(stats.valueCounts)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .slice(0, 4)
                          .map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center text-xs">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                status.toLowerCase().includes('closed') || status.toLowerCase().includes('complete') 
                                  ? 'bg-green-500/20 text-green-400'
                                  : status.toLowerCase().includes('open') || status.toLowerCase().includes('pending')
                                  ? 'bg-yellow-500/20 text-yellow-400' 
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {status}
                              </span>
                              <span className="font-semibold text-zinc-200">
                                {(count as number).toLocaleString()}
                              </span>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};