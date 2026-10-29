import React from 'react';
import { motion } from 'framer-motion';
import { Factory, TrendingUp, Package, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { BatchProductionChart } from './charts/BatchProductionChart';
import { MaterialConsumptionChart } from './charts/MaterialConsumptionChart';
import { CostAnalysisChart } from './charts/CostAnalysisChart';
import { TopIngredientsChart } from './charts/TopIngredientsChart';
import { ScrapAnalysisChart } from './charts/ScrapAnalysisChart';
import { TimelineChart } from './charts/TimelineChart';
import { ProductionKPIs } from './ProductionKPIs';
import { useDataStore } from '../../store/dataStore';

export const ProductionDashboard: React.FC = () => {
  const processedData = useDataStore(state => state.processedData);

  // Check if we have manufacturing data
  if (!processedData?.rows || !processedData?.headers) {
    return (
      <div className="flex items-center justify-center h-96 text-center">
        <div>
          <Factory className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Production Data</h3>
          <p className="text-gray-600">Upload manufacturing CSV data to view production analytics</p>
        </div>
      </div>
    );
  }

  const hasWipData = processedData.headers.some(h => h.toLowerCase().includes('wip_')) ||
                    processedData.headers.some(h => h.toLowerCase().includes('batch')) ||
                    processedData.rows.some(row => row.WIP_TYPE);

  if (!hasWipData) {
    return (
      <div className="flex items-center justify-center h-96 text-center">
        <div>
          <AlertTriangle className="h-16 w-16 mx-auto text-orange-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Not Manufacturing Data</h3>
          <p className="text-gray-600">This dataset doesn't contain manufacturing WIP data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Factory className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Production Analytics Dashboard</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Comprehensive insights into factory operations, material efficiency, and cost optimization
        </p>
      </motion.div>

      {/* KPIs Section */}
      <ProductionKPIs />

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Production Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <BatchProductionChart />
        </motion.div>

        {/* Material Consumption */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MaterialConsumptionChart />
        </motion.div>

        {/* Cost Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CostAnalysisChart />
        </motion.div>

        {/* Top Ingredients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TopIngredientsChart />
        </motion.div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scrap Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ScrapAnalysisChart />
        </motion.div>

        {/* Timeline Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <TimelineChart />
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center py-8 border-t border-gray-200"
      >
        <p className="text-sm text-gray-500">
          Production analytics powered by WIP manufacturing data • Last updated: {new Date().toLocaleString()}
        </p>
      </motion.div>
    </div>
  );
};
