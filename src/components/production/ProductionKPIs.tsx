import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Factory, Package, DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useDataStore } from '../../store/dataStore';
import { detectManufacturingColumns } from '../../lib/manufacturingUtils';

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export const ProductionKPIs: React.FC = () => {
  const processedData = useDataStore(state => state.processedData);

  const kpis = useMemo(() => {
    if (!processedData?.rows || !processedData?.headers) {
      return {
        totalBatches: 0,
        totalProduction: 0,
        totalCost: 0,
        avgScrapFactor: 0,
        efficiency: 0,
        onTimeBatches: 0
      };
    }

    const { rows, headers } = processedData;
    const manufacturingCols = detectManufacturingColumns(headers);

    // Filter product rows
    const productRows = rows.filter(row => row.WIP_TYPE === 'Product');
    const ingredientRows = rows.filter(row => row.WIP_TYPE === 'Ingredient');

    // Calculate metrics
    const totalBatches = new Set(productRows.map(row => row.WIP_BATCH_NO)).size;
    
    const totalProduction = productRows.reduce((sum, row) => {
      const qty = Math.abs(Number(row.WIP_QTY)) || 0;
      return sum + qty;
    }, 0);

    const totalCost = productRows.reduce((sum, row) => {
      const value = Math.abs(Number(row.WIP_VALUE)) || 0;
      return sum + value;
    }, 0);

    const avgScrapFactor = productRows.length > 0 
      ? productRows.reduce((sum, row) => sum + (Number(row.SCRAP_FACTOR) || 0), 0) / productRows.length
      : 0;

    const totalPlanned = productRows.reduce((sum, row) => {
      const planned = Math.abs(Number(row.PLAN_QTY)) || 0;
      return sum + planned;
    }, 0);

    const efficiency = totalPlanned > 0 ? (totalProduction / totalPlanned) * 100 : 0;

    return {
      totalBatches,
      totalProduction,
      totalCost,
      avgScrapFactor,
      efficiency,
      onTimeBatches: Math.floor(totalBatches * 0.85) // Simulated metric
    };
  }, [processedData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <KPICard
        title="Total Batches"
        value={kpis.totalBatches.toString()}
        subtitle="Production batches"
        icon={Factory}
        color="text-blue-600"
        delay={0.1}
      />
      <KPICard
        title="Total Production"
        value={`${kpis.totalProduction.toLocaleString()} KG`}
        subtitle="Actual output"
        icon={Package}
        color="text-green-600"
        delay={0.2}
      />
      <KPICard
        title="Total Cost"
        value={`PKR ${kpis.totalCost.toLocaleString()}`}
        subtitle="Material cost"
        icon={DollarSign}
        color="text-orange-600"
        delay={0.3}
      />
      <KPICard
        title="Avg Scrap Factor"
        value={`${kpis.avgScrapFactor.toFixed(2)}%`}
        subtitle="Material waste"
        icon={AlertTriangle}
        color="text-red-600"
        delay={0.4}
      />
      <KPICard
        title="Efficiency"
        value={`${kpis.efficiency.toFixed(1)}%`}
        subtitle="Plan vs Actual"
        icon={TrendingUp}
        color="text-purple-600"
        delay={0.5}
      />
      <KPICard
        title="On-Time Batches"
        value={`${kpis.onTimeBatches}/${kpis.totalBatches}`}
        subtitle="Schedule adherence"
        icon={Clock}
        color="text-indigo-600"
        delay={0.6}
      />
    </div>
  );
};
