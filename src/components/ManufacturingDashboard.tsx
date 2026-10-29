import React from 'react';
import { useDataStore } from '../store/dataStore';
import { ChartManufacturingBatch } from './charts/ChartManufacturingBatch';
import { ChartIngredientCostContribution } from './charts/ChartIngredientCostContribution';
import { ChartIngredientUsagePie } from './charts/ChartIngredientUsagePie';
import { ChartProductionOutput } from './charts/ChartProductionOutput';
import { detectManufacturingColumns, formatDate } from '../lib/manufacturingUtils';
import { Factory, TrendingUp, Package, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { motion } from 'framer-motion';

export const ManufacturingDashboard: React.FC = () => {
  const processedData = useDataStore(state => state.processedData);

  if (!processedData?.rows) return null;

  const manufacturingCols = detectManufacturingColumns(processedData.headers);
  
  if (!manufacturingCols.hasWipBatchNo || !manufacturingCols.hasWipValue) {
    return null;
  }

  // Calculate key metrics
  const totalBatches = new Set(processedData.rows.map(row => row[manufacturingCols.wipBatchNoCol!])).size;
  const productRows = processedData.rows.filter(row => row.WIP_TYPE === 'Product');
  const totalValue = productRows.reduce((sum, row) => sum + (Number(row[manufacturingCols.wipValueCol!]) || 0), 0);
  const totalQuantity = productRows.reduce((sum, row) => sum + (Number(row[manufacturingCols.wipQtyCol!]) || 0), 0);
  const avgBatchValue = totalBatches > 0 ? totalValue / totalBatches : 0;

  // Get date range
  const dates = processedData.rows
    .map(row => row[manufacturingCols.wipStartDateCol!])
    .filter(date => date)
    .map(date => new Date(date as string))
    .sort((a, b) => a.getTime() - b.getTime());
  
  const dateRange = dates.length > 0 
    ? `${formatDate(dates[0].toISOString())} - ${formatDate(dates[dates.length - 1].toISOString())}`
    : 'Unknown';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Factory className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Manufacturing Analytics</h1>
        </div>
        <p className="text-gray-600">Production batch analysis and performance insights</p>
        <p className="text-sm text-gray-500">Data Period: {dateRange}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBatches.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Production batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Production value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Units produced</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Batch Value</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgBatchValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per batch average</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights Charts */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost & Usage Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartIngredientCostContribution />
            <ChartIngredientUsagePie />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Production Trends</h2>
          <ChartProductionOutput />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Batch Performance</h2>
          <ChartManufacturingBatch />
        </motion.div>
      </div>

      {/* Additional Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Production Insights
            </CardTitle>
            <CardDescription>Key observations from your manufacturing data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Manufacturing data spans {dates.length > 0 ? Math.ceil((dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24)) : 0} days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">{totalBatches} unique batches processed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Average batch size: {totalBatches > 0 ? (totalQuantity / totalBatches).toFixed(2) : 0} units</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              Data Quality
            </CardTitle>
            <CardDescription>Assessment of your manufacturing dataset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Batch Records</span>
              <span className="text-sm font-semibold text-green-600">{processedData.rows.length} rows</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Product Records</span>
              <span className="text-sm font-semibold text-blue-600">{productRows.length} rows</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Ingredient Records</span>
              <span className="text-sm font-semibold text-orange-600">{processedData.rows.length - productRows.length} rows</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
