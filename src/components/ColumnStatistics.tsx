import React from 'react';
import { useDataStore } from '../store/dataStore';

export const ColumnStatistics: React.FC = () => {
  const processedData = useDataStore(state => state.processedData);

  if (!processedData) return null;

  const { columnStats } = processedData.summary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(columnStats).map(([column, stats]) => (
        <div key={column} className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">{column}</h3>
          <div className="space-y-2">
            {stats.min !== undefined && (
              <p className="text-sm text-gray-600">
                Min: <span className="font-medium">{stats.min}</span>
              </p>
            )}
            {stats.max !== undefined && (
              <p className="text-sm text-gray-600">
                Max: <span className="font-medium">{stats.max}</span>
              </p>
            )}
            {stats.mean !== undefined && (
              <p className="text-sm text-gray-600">
                Mean: <span className="font-medium">{stats.mean.toFixed(2)}</span>
              </p>
            )}
            {stats.median !== undefined && (
              <p className="text-sm text-gray-600">
                Median: <span className="font-medium">{stats.median}</span>
              </p>
            )}
            <p className="text-sm text-gray-600">
              Unique Values: <span className="font-medium">{stats.uniqueValues}</span>
            </p>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Most Common Values:</p>
              <ul className="space-y-1">
                {stats.mostCommon?.map(({ value, count }) => (
                  <li key={value} className="text-sm text-gray-600">
                    {value}: <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};