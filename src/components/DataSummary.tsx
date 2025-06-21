import React from 'react';
import { useDataStore } from '../store/dataStore';
import { Database, Table, BarChart, Hash, FileText, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

const PremiumButton = ({ children, onClick, className = "" }) => (
  <button 
    onClick={onClick}
    className={`bg-gray-100 hover:bg-gray-200 no-underline group cursor-pointer relative shadow-sm border border-gray-200 rounded-full p-px text-xs font-semibold leading-6 text-gray-700 inline-block transition-all duration-300 ${className}`}
  >
    <span className="absolute inset-0 overflow-hidden rounded-full">
      <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(59,130,246,0.1)_0%,rgba(59,130,246,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </span>
    <div className="relative flex space-x-2 items-center z-10 rounded-full bg-white py-0.5 px-4 ring-1 ring-gray-200 group-hover:ring-blue-300">
      <span className="text-gray-700 group-hover:text-blue-700">{children}</span>
      <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
    </div>
    <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-blue-400/0 via-blue-400/50 to-blue-400/0 transition-opacity duration-500 group-hover:opacity-40" />
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
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{label}</CardTitle>
        <Icon className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className="text-xs text-gray-500 mt-1">Data points analyzed</p>
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Dataset Overview
          </h2>
          <p className="text-lg text-gray-600">
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
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-gray-900">Column Statistics</CardTitle>
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
                  className="p-4 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <h4 className="font-medium text-gray-900 mb-2">{col}</h4>
                  <div className="space-y-1 text-sm">
                    {stats.min !== undefined && (
                      <p className="text-gray-600">Min: <span className="text-gray-900 font-medium">{stats.min}</span></p>
                    )}
                    {stats.max !== undefined && (
                      <p className="text-gray-600">Max: <span className="text-gray-900 font-medium">{stats.max}</span></p>
                    )}
                    {stats.mean !== undefined && (
                      <p className="text-gray-600">Mean: <span className="text-gray-900 font-medium">{stats.mean.toFixed(2)}</span></p>
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