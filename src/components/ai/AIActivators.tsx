import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Users, 
  ArrowRight,
  Brain,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useDataStore } from '../../store/dataStore';
import { generateSalesForecast, detectAnomalies, runWhatIfSimulation, generateCustomerInsights } from '../../services/gemini';
import { AIActivatorModal } from '../AIActivatorModal';

interface AIActivator {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  action: () => void;
  isEnabled: boolean;
  beta?: boolean;
}

interface AIActivatorsProps {
  onActivate?: (activatorId: string) => void;
  className?: string;
}

const AIActivatorCard: React.FC<{ 
  activator: AIActivator; 
  index: number;
  onClick: () => void;
}> = ({ activator, index, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { title, description, icon: Icon, color, bgColor, borderColor, isEnabled, beta } = activator;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        disabled={!isEnabled}
        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left group ${
          isEnabled 
            ? `${bgColor} ${borderColor} hover:shadow-md cursor-pointer` 
            : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <h4 className="font-semibold text-gray-900 group-hover:text-gray-800">
                {title}
              </h4>
              {beta && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Beta
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 group-hover:text-gray-700">
              {description}
            </p>
          </div>
          
          <motion.div
            animate={{ x: isHovered && isEnabled ? 4 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight className={`w-4 h-4 ${isEnabled ? color : 'text-gray-400'}`} />
          </motion.div>
        </div>
      </button>
    </motion.div>
  );
};

export const AIActivators: React.FC<AIActivatorsProps> = ({ 
  onActivate,
  className = '' 
}) => {
  const processedData = useDataStore(state => state.processedData);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    isLoading: boolean;
    activatorType: 'sales_forecast' | 'anomaly_detection' | 'whatif_simulation' | 'customer_insights';
  }>({
    isOpen: false,
    title: '',
    content: '',
    isLoading: false,
    activatorType: 'sales_forecast'
  });

  const handleActivatorClick = async (activatorId: string, activatorType: 'sales_forecast' | 'anomaly_detection' | 'whatif_simulation' | 'customer_insights') => {
    if (!processedData?.rows) {
      alert('Please upload a CSV file first to use AI activators.');
      return;
    }

    // Open modal with loading state
    setModalState({
      isOpen: true,
      title: activatorId,
      content: '',
      isLoading: true,
      activatorType
    });

    try {
      let result = '';
      
      switch (activatorType) {
        case 'sales_forecast':
          result = await generateSalesForecast(processedData.rows);
          break;
        case 'anomaly_detection':
          result = await detectAnomalies(processedData.rows);
          break;
        case 'whatif_simulation':
          result = await runWhatIfSimulation(processedData.rows);
          break;
        case 'customer_insights':
          result = await generateCustomerInsights(processedData.rows);
          break;
        default:
          result = 'AI analysis completed.';
      }

      // Update modal with results
      setModalState(prev => ({
        ...prev,
        content: result,
        isLoading: false
      }));

      // Call parent callback if provided
      if (onActivate) {
        onActivate(activatorId);
      }
    } catch (error) {
      console.error('Error running AI activator:', error);
      setModalState(prev => ({
        ...prev,
        content: 'Sorry, there was an error analyzing your data. Please try again later.',
        isLoading: false
      }));
    }
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const activators: AIActivator[] = [
    {
      id: 'sales-forecast',
      title: 'Sales Forecast',
      description: 'Predict next quarter trends',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      action: () => handleActivatorClick('Sales Forecast', 'sales_forecast'),
      isEnabled: true
    },
    {
      id: 'anomaly-detector',
      title: 'Anomaly Detector',
      description: 'Find unusual patterns',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      action: () => handleActivatorClick('Anomaly Detector', 'anomaly_detection'),
      isEnabled: true
    },
    {
      id: 'what-if-simulator',
      title: 'What-If Simulator',
      description: 'Test different scenarios',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      action: () => handleActivatorClick('What-If Simulator', 'whatif_simulation'),
      isEnabled: true,
      beta: true
    },
    {
      id: 'customer-insights',
      title: 'Customer Insights',
      description: 'Analyze buying behavior',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      action: () => handleActivatorClick('Customer Insights', 'customer_insights'),
      isEnabled: true
    }
  ];

  return (
    <>
      <Card className={`border-gray-200 bg-white shadow-sm ${className}`}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              <Zap className="h-4 w-4 text-yellow-500" />
            </div>
            <CardTitle className="text-gray-900">AI Activators</CardTitle>
          </div>
          <CardDescription>Quick data interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activators.map((activator, index) => (
              <AIActivatorCard
                key={activator.id}
                activator={activator}
                index={index}
                onClick={activator.action}
              />
            ))}
          </div>
          
          {/* Footer hint */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Click any activator to get started with AI-powered analysis
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Activator Modal */}
      <AIActivatorModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        content={modalState.content}
        isLoading={modalState.isLoading}
        activatorType={modalState.activatorType}
      />
    </>
  );
}; 