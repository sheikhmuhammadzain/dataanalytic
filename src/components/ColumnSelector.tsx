import React from 'react';
import { useDataStore } from '../store/dataStore';
import { Check } from 'lucide-react';

export const ColumnSelector: React.FC = () => {
  const { processedData, selectedColumns, setSelectedColumns } = useDataStore();

  if (!processedData) return null;

  const handleColumnToggle = (column: string) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter(c => c !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {processedData.headers.map(column => (
        <label
          key={column}
          className="flex items-center space-x-2"
        >
          <div
            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
              selectedColumns.includes(column)
                ? 'bg-primary border-primary'
                : 'border-primary'
            }`}
            onClick={() => handleColumnToggle(column)}
          >
            {selectedColumns.includes(column) && (
              <Check className="h-3 w-3 text-primary-foreground" />
            )}
          </div>
          <span className="text-sm">{column}</span>
        </label>
      ))}
    </div>
  );
};