import { useEffect } from 'react';
import { ManufacturingAnalyticsDashboard } from './components/ManufacturingAnalyticsDashboard';
import { useManufacturingDataStore } from './store/manufacturingDataStore';

function App() {
  const { loadAllData } = useManufacturingDataStore();

  // Auto-fetch all manufacturing data when the app loads
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Manufacturing Analytics Dashboard - Always shown */}
      <ManufacturingAnalyticsDashboard />
    </div>
  );
}

export default App;