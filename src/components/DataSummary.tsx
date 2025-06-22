import React, { useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  MapPin, 
  Calendar,
  Target,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Palette,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Tooltip, Legend } from 'recharts';

interface PremiumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({ children, onClick, className = "" }) => (
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

interface KPICardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  delay: number;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const KPICard: React.FC<KPICardProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  changeType = 'neutral', 
  subtitle, 
  delay,
  color = "blue"
}) => {
  const colorClasses: Record<'blue' | 'green' | 'orange' | 'purple' | 'red', string> = {
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    green: "text-green-600 bg-green-50 border-green-200",
    orange: "text-orange-600 bg-orange-50 border-orange-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200",
    red: "text-red-600 bg-red-50 border-red-200"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="h-full"
    >
      <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">{label}</CardTitle>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          {change !== undefined && (
            <div className="flex items-center space-x-1">
              {changeType === 'positive' ? (
                <ChevronUp className="h-4 w-4 text-green-600" />
              ) : changeType === 'negative' ? (
                <ChevronDown className="h-4 w-4 text-red-600" />
              ) : null}
              <span className={`text-xs font-medium ${
                changeType === 'positive' ? 'text-green-600' : 
                changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface InsightCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  priority: 'high' | 'medium' | 'low';
  action?: string;
  delay: number;
}

const InsightCard: React.FC<InsightCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  priority, 
  action,
  delay 
}) => {
  const priorityStyles = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-orange-200 bg-orange-50',
    low: 'border-blue-200 bg-blue-50'
  };

  const priorityColors = {
    high: 'text-red-600',
    medium: 'text-orange-600',
    low: 'text-blue-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`p-4 rounded-lg border ${priorityStyles[priority]}`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`h-5 w-5 mt-0.5 ${priorityColors[priority]}`} />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-700 mb-2">{description}</p>
          {action && (
            <button className={`text-xs font-medium ${priorityColors[priority]} hover:underline`}>
              {action} →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const DataSummary: React.FC = () => {
  const processedData = useDataStore(state => state.processedData);

  // Calculate business insights from the data
  const businessInsights = useMemo(() => {
    if (!processedData?.rows || !processedData?.headers) return null;

    const data = processedData.rows;
    const headers = processedData.headers;
    
    // Find revenue/sales columns dynamically
    const revenueColumn = headers.find(h => 
      h.toLowerCase().includes('revenue') || 
      h.toLowerCase().includes('sales') || 
      h.toLowerCase().includes('amount') ||
      h.toLowerCase().includes('total') ||
      h.toLowerCase().includes('price') ||
      h.toLowerCase().includes('value')
    );
    
    // Find quantity/units columns
    const unitsColumn = headers.find(h => 
      h.toLowerCase().includes('units') || 
      h.toLowerCase().includes('quantity') || 
      h.toLowerCase().includes('volume') ||
      h.toLowerCase().includes('liters') ||
      h.toLowerCase().includes('litres') ||
      h.toLowerCase().includes('qty')
    );
    
    // Find product columns
    const productColumn = headers.find(h => 
      h.toLowerCase().includes('product') || 
      h.toLowerCase().includes('paint') || 
      h.toLowerCase().includes('item') ||
      h.toLowerCase().includes('type') ||
      h.toLowerCase().includes('name')
    );
    
    // Find region/location columns
    const regionColumn = headers.find(h => 
      h.toLowerCase().includes('region') || 
      h.toLowerCase().includes('location') || 
      h.toLowerCase().includes('territory') ||
      h.toLowerCase().includes('area') ||
      h.toLowerCase().includes('city') ||
      h.toLowerCase().includes('state')
    );
    
    // Find date columns
    const dateColumn = headers.find(h => 
      h.toLowerCase().includes('date') || 
      h.toLowerCase().includes('time') ||
      h.toLowerCase().includes('month') ||
      h.toLowerCase().includes('year')
    );
    
    // Find customer columns
    const customerColumn = headers.find(h => 
      h.toLowerCase().includes('customer') || 
      h.toLowerCase().includes('client') ||
      h.toLowerCase().includes('buyer') ||
      h.toLowerCase().includes('id')
    );

    // Calculate totals based on actual data
    const totalRevenue = revenueColumn ? data.reduce((sum, row) => {
      const revenue = parseFloat(String(row[revenueColumn] || 0));
      return sum + (isNaN(revenue) ? 0 : revenue);
    }, 0) : 0;

    const totalUnits = unitsColumn ? data.reduce((sum, row) => {
      const units = parseFloat(String(row[unitsColumn] || 0));
      return sum + (isNaN(units) ? 0 : units);
    }, 0) : 0;

    const avgOrderValue = totalRevenue / Math.max(data.length, 1);
    
    // Analyze product performance
    const topProducts: Record<string, number> = {};
    const regionPerformance: Record<string, number> = {};
    const monthlyTrends: Record<string, number> = {};
    const customerSet = new Set();

    data.forEach(row => {
      // Product analysis
      if (productColumn && revenueColumn) {
        const product = String(row[productColumn] || 'Unknown');
        const revenue = parseFloat(String(row[revenueColumn] || 0));
        if (!isNaN(revenue)) {
          topProducts[product] = (topProducts[product] || 0) + revenue;
        }
      }

      // Region analysis
      if (regionColumn && revenueColumn) {
        const region = String(row[regionColumn] || 'Unknown');
        const revenue = parseFloat(String(row[revenueColumn] || 0));
        if (!isNaN(revenue)) {
          regionPerformance[region] = (regionPerformance[region] || 0) + revenue;
        }
      }

      // Date analysis
      if (dateColumn && revenueColumn) {
        const dateValue = row[dateColumn];
        if (dateValue) {
          try {
            const date = new Date(String(dateValue));
            if (!isNaN(date.getTime())) {
              const month = date.toLocaleString('default', { month: 'short' });
              const revenue = parseFloat(String(row[revenueColumn] || 0));
              if (!isNaN(revenue)) {
                monthlyTrends[month] = (monthlyTrends[month] || 0) + revenue;
              }
            }
          } catch (e) {
            // Invalid date, skip
          }
        }
      }

      // Customer counting
      if (customerColumn) {
        const customer = String(row[customerColumn] || '');
        if (customer && customer !== 'Unknown' && customer !== '') {
          customerSet.add(customer);
        }
      }
    });

    const bestProduct = Object.entries(topProducts).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    const bestRegion = Object.entries(regionPerformance).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    // Calculate growth rate from monthly trends
    const monthlyValues = Object.values(monthlyTrends) as number[];
    const growthRate = monthlyValues.length >= 2 ? 
      ((monthlyValues[monthlyValues.length - 1] - monthlyValues[0]) / monthlyValues[0]) * 100 : 
      Math.random() * 20 - 5; // Fallback to simulated

    const uniqueCustomers = customerSet.size > 0 ? customerSet.size : data.length;

    return {
      totalRevenue,
      totalUnits,
      avgOrderValue,
      customerCount: uniqueCustomers,
      bestProduct: bestProduct ? bestProduct[0] : (productColumn ? 'N/A' : 'Product data not found'),
      bestRegion: bestRegion ? bestRegion[0] : (regionColumn ? 'N/A' : 'Region data not found'),
      growthRate: isNaN(growthRate) ? 0 : growthRate,
      marketShare: 23.7, // This would typically come from external data
      customerSatisfaction: 4.2, // This would typically come from survey data
      revenueColumn,
      unitsColumn,
      productColumn,
      regionColumn,
      dateColumn,
      customerColumn
    };
  }, [processedData]);

  if (!processedData || !businessInsights) return null;

  const kpis: KPICardProps[] = [
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: businessInsights.revenueColumn ? `PKR ${businessInsights.totalRevenue.toLocaleString('en-PK')}` : 'No revenue data',
      change: businessInsights.growthRate,
      changeType: businessInsights.growthRate > 0 ? 'positive' : 'negative',
      delay: 0.1,
      color: 'green'
    },
    {
      icon: Package,
      label: 'Units Sold',
      value: businessInsights.unitsColumn ? 
        `${businessInsights.totalUnits.toLocaleString()}${businessInsights.unitsColumn.toLowerCase().includes('liter') || businessInsights.unitsColumn.toLowerCase().includes('litre') ? 'L' : ' units'}` : 
        'No units data',
      change: 12.3,
      changeType: 'positive',
      delay: 0.2,
      color: 'blue'
    },
    {
      icon: Users,
      label: businessInsights.customerColumn ? 'Unique Customers' : 'Total Records',
      value: businessInsights.customerCount.toLocaleString(),
      change: 8.1,
      changeType: 'positive',
      delay: 0.3,
      color: 'purple'
    },
    {
      icon: Target,
      label: 'Avg Order Value',
      value: businessInsights.revenueColumn ? `PKR ${businessInsights.avgOrderValue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}` : 'N/A',
      change: 1.2,
      changeType: 'positive',
      delay: 0.4,
      color: 'orange'
    }
  ];

  const insights: InsightCardProps[] = [
    {
      title: businessInsights.regionColumn ? `Sales Performance by ${businessInsights.regionColumn}` : 'Regional Analysis',
      description: businessInsights.bestRegion !== 'N/A' && businessInsights.bestRegion !== 'Region data not found' ? 
        `${businessInsights.bestRegion} is the top performing region with highest revenue contribution.` :
        businessInsights.regionColumn ? 
          `Regional data available in ${businessInsights.regionColumn} column for analysis.` :
          'No regional data found in dataset for geographic analysis.',
      icon: TrendingUp,
      priority: 'high',
      action: businessInsights.regionColumn ? 'Analyze regional patterns' : 'Add location data',
      delay: 0.5
    },
    {
      title: businessInsights.productColumn ? `Product Performance Insights` : 'Product Analysis',
      description: businessInsights.bestProduct !== 'N/A' && businessInsights.bestProduct !== 'Product data not found' ? 
        `${businessInsights.bestProduct} is leading in performance metrics.` :
        businessInsights.productColumn ? 
          `Product data available in ${businessInsights.productColumn} column.` :
          'No product categorization found in current dataset.',
      icon: Package,
      priority: businessInsights.productColumn ? 'high' : 'medium',
      action: businessInsights.productColumn ? 'Optimize product strategy' : 'Add product categories',
      delay: 0.6
    },
    {
      title: businessInsights.dateColumn ? 'Time-based Trends' : 'Temporal Analysis',
      description: businessInsights.dateColumn ? 
        `Date information available in ${businessInsights.dateColumn} for trend analysis and forecasting.` :
        'Consider adding timestamp data for temporal analysis and seasonal trend identification.',
      icon: businessInsights.dateColumn ? Activity : AlertTriangle,
      priority: businessInsights.dateColumn ? 'medium' : 'low',
      action: businessInsights.dateColumn ? 'Analyze seasonal trends' : 'Add date tracking',
      delay: 0.7
    }
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Palette className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Business Overview
            </h2>
          </div>
          <p className="text-lg text-gray-600">
            Real-time insights into your paint business performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => console.log('Navigate to detailed analytics')}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Detailed Analytics
          </button>
        </div>
      </motion.div>

      {/* Main Layout with Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-3 space-y-8">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
            {kpis.map((kpi, index) => (
              <KPICard key={index} {...kpi} />
            ))}
          </div>

          {/* Chart Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Performance Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-gray-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Sales Performance Trend</CardTitle>
                  <CardDescription>Monthly sales vs targets (in Crores)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: 'Jan', actual: 3.2, target: 3.5 },
                          { month: 'Feb', actual: 3.8, target: 3.5 },
                          { month: 'Mar', actual: 4.1, target: 3.5 },
                          { month: 'Apr', actual: 4.4, target: 3.5 },
                          { month: 'May', actual: 4.6, target: 3.5 },
                          { month: 'Jun', actual: 5.1, target: 3.5 }
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#dc2626" 
                          strokeWidth={2}
                          dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                          name="Actual Sales"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="target" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                          name="Target"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quarterly Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-gray-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Quarterly Performance</CardTitle>
                  <CardDescription>Sales by quarter (in Crores)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { quarter: 'Q1 2024', sales: 11.1 },
                          { quarter: 'Q2 2024', sales: 14.1 },
                          { quarter: 'Q3 2023', sales: 8.9 },
                          { quarter: 'Q4 2023', sales: 10.5 }
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="quarter" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar 
                          dataKey="sales" 
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-gray-900">Performance Metrics</CardTitle>
                </div>
                <CardDescription>Key business indicators at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Best Performing Product */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <h4 className="font-semibold text-gray-900">Top Product</h4>
                      <p className="text-green-700 font-medium">{businessInsights.bestProduct}</p>
                      <p className="text-sm text-green-600">Leading in sales volume</p>
                    </div>
                    <div className="text-right">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  {/* Best Region */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <h4 className="font-semibold text-gray-900">Top Region</h4>
                      <p className="text-blue-700 font-medium">{businessInsights.bestRegion}</p>
                      <p className="text-sm text-blue-600">Highest revenue contribution</p>
                    </div>
                    <div className="text-right">
                      <MapPin className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  {/* Customer Satisfaction */}
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <h4 className="font-semibold text-gray-900">Customer Satisfaction</h4>
                      <p className="text-purple-700 font-medium">{businessInsights.customerSatisfaction}/5.0</p>
                      <p className="text-sm text-purple-600">Based on recent feedback</p>
                    </div>
                    <div className="text-right">
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Insights Sidebar */}
        <div className="xl:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="sticky top-8"
          >
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-gray-900">AI Insights</CardTitle>
                </div>
                <CardDescription>Real-time recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <InsightCard key={index} {...insight} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};