import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cog, 
  RefreshCw, 
  AlertTriangle,
  BarChart3,
  Package,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useManufacturingDataStore } from '../../store/manufacturingDataStore';
import type {
  MaterialChangesData,
  ReplacementIdData
} from '../../services/manufacturingAnalyticsService';

interface OperationsMetrics {
  totalMaterialChanges: number;
  totalReplacements: number;
  avgChangeQty: number;
  topReplacementReason: string;
}

export const OperationsTab: React.FC = () => {
  const [metrics, setMetrics] = useState<OperationsMetrics>({
    totalMaterialChanges: 0,
    totalReplacements: 0,
    avgChangeQty: 0,
    topReplacementReason: 'N/A'
  });

  // Get data from central store
  const {
    rawMaterialChangesData: materialChangesData,
    replacementIdentificationData: replacementData,
    isLoading: loading,
    hasData
  } = useManufacturingDataStore();

  useEffect(() => {
    if (hasData) {
      // Calculate metrics when data is available
      const totalMaterialChanges = materialChangesData.length;
      const totalReplacements = replacementData.reduce((sum, item) => sum + (item.count || 0), 0);
      const avgChangeQty = materialChangesData.length > 0 
        ? materialChangesData.reduce((sum, item) => sum + Math.abs(item.total_qty_change || 0), 0) / materialChangesData.length 
        : 0;
      const topReplacementReason = replacementData.length > 0 
        ? replacementData.sort((a, b) => (b.count || 0) - (a.count || 0))[0].REASON 
        : 'N/A';

      setMetrics({
        totalMaterialChanges,
        totalReplacements,
        avgChangeQty,
        topReplacementReason
      });
    }
  }, [hasData, materialChangesData, replacementData]);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'];

  if (loading || !hasData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Material Changes</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalMaterialChanges.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Raw material change events</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Replacements</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalReplacements.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total replacement instances</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Change Qty</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgChangeQty.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Average quantity change</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Reason</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{metrics.topReplacementReason}</div>
              <p className="text-xs text-muted-foreground">Most common replacement reason</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Replacement Identification Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="h-5 w-5 text-orange-600" />
                Replacement Identification
              </CardTitle>
              <CardDescription>
                Distribution of replacements by reason
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={replacementData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ REASON, count, percent }) => {
                        const reasonText = REASON && REASON.length > 15 
                          ? REASON.substring(0, 15) + '...' 
                          : REASON || 'Unknown';
                        return `${reasonText}: ${count} (${(percent! * 100).toFixed(0)}%)`;
                      }}
                    >
                      {replacementData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} instances`, 'Count']}
                      labelFormatter={(label) => `Reason: ${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Raw Material Changes Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                Raw Material Changes
              </CardTitle>
              <CardDescription>
                Recent material quantity changes by batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-semibold">Period</th>
                      <th className="text-left p-2 font-semibold">Batch Status</th>
                      <th className="text-left p-2 font-semibold">Lot Number</th>
                      <th className="text-left p-2 font-semibold">Qty Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialChangesData
                      .sort((a, b) => Math.abs(b.total_qty_change || 0) - Math.abs(a.total_qty_change || 0))
                      .slice(0, 50)
                      .map((change, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{change.WIP_PERIOD_NAME}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              change.WIP_BATCH_STATUS === 'Complete' ? 'bg-green-100 text-green-800' :
                              change.WIP_BATCH_STATUS === 'In Process' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {change.WIP_BATCH_STATUS}
                            </span>
                          </td>
                          <td className="p-2 font-mono text-xs">{change.WIP_LOT_NUMBER}</td>
                          <td className={`p-2 font-semibold ${
                            (change.total_qty_change || 0) > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(change.total_qty_change || 0) > 0 ? '+' : ''}{(change.total_qty_change || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                
                {materialChangesData.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    No material change data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Replacement Reasons Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Replacement Reasons Summary
              </CardTitle>
              <CardDescription>
                Detailed breakdown of replacement reasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 overflow-y-auto">
                <div className="space-y-3">
                  {replacementData
                    .sort((a, b) => (b.count || 0) - (a.count || 0))
                    .map((replacement, index) => {
                      const percentage = metrics.totalReplacements > 0 
                        ? ((replacement.count || 0) / metrics.totalReplacements) * 100 
                        : 0;
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {replacement.REASON || 'Unknown Reason'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {replacement.count} instances ({percentage.toFixed(1)}%)
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold">{replacement.count}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {replacementData.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    No replacement data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Operations Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Operations Insights
              </CardTitle>
              <CardDescription>
                Key observations from operations data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-sm">
                    <span className="font-medium">Material Changes: </span>
                    {metrics.totalMaterialChanges} raw material change events recorded across all batches
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-sm">
                    <span className="font-medium">Replacement Activity: </span>
                    {metrics.totalReplacements} total replacement instances with "{metrics.topReplacementReason}" as the top reason
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-sm">
                    <span className="font-medium">Change Impact: </span>
                    Average quantity change of {metrics.avgChangeQty.toFixed(1)} units per material change event
                  </div>
                </div>
                
                {replacementData.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm">
                      <span className="font-medium">Reason Diversity: </span>
                      {replacementData.length} different replacement reasons identified, indicating varied operational challenges
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
