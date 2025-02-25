import React from 'react';
import { Search } from 'lucide-react';
import { useDataStore } from '../store/dataStore';

export const SearchFilter: React.FC = () => {
  const { filterValue, setFilterValue } = useDataStore();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        placeholder="Search in data..."
        className="flex h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};