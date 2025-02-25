import React from 'react';
import { useDataStore } from '../store/dataStore';
import { Database, Table, BarChart, Hash, FileText, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

const PremiumButton = ({ children, onClick, className = "" }) => (
  <button 
    onClick={onClick}
    className={`bg-slate-800 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block ${className}`}
  >
    <span className="absolute inset-0 overflow-hidden rounded-full">
      <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </span>
    <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10">
      <span>{children}</span>
      <ArrowRight className="h-4 w-4" />
    </div>
    <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40" />
  </button>
);

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className="border-white/[0.2] bg-black/40 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-purple-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <p className="text-xs text-white/50 mt-1">Data points analyzed</p>
      </CardContent>
    </Card>
  </motion.div>
);

export const DataSummary: React.FC = () => {
  const processedData = useDataStore(state => state.processedData);

  if (!processedData) return null;

  const { summary } = processedData;

  const stats = [
    {
      icon: Database,
      label: 'Total Rows',
      value: summary.rowCount.toLocaleString(),
      delay: 0.1
    },
    {
      icon: Table,
      label: 'Total Columns',
      value: summary.columnCount.toLocaleString(),
      delay: 0.2
    },
    {
      icon: Hash,
      label: 'Numerical Columns',
      value: summary.numericalColumns.length.toLocaleString(),
      delay: 0.3
    },
    {
      icon: FileText,
      label: 'Categorical Columns',
      value: summary.categoricalColumns.length.toLocaleString(),
      delay: 0.4
    }
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-4"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Dataset Overview
          </h2>
          <p className="text-lg text-white/50">
            A comprehensive summary of your dataset's structure and composition
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-white/[0.2] bg-black/40 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-indigo-400" />
                <CardTitle>Column Statistics</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(summary.columnStats).map(([col, stats], index) => (
                <motion.div
                  key={col}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="p-4 rounded-lg bg-white/[0.03] border border-indigo-500/10"
                >
                  <h4 className="font-medium text-white mb-2">{col}</h4>
                  <div className="space-y-1 text-sm">
                    {stats.min !== undefined && (
                      <p className="text-white/50">Min: <span className="text-white">{stats.min}</span></p>
                    )}
                    {stats.max !== undefined && (
                      <p className="text-white/50">Max: <span className="text-white">{stats.max}</span></p>
                    )}
                    {stats.mean !== undefined && (
                      <p className="text-white/50">Mean: <span className="text-white">{stats.mean.toFixed(2)}</span></p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};