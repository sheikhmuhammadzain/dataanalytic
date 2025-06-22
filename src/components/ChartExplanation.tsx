import React, { useState } from 'react';
import { HelpCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateChartExplanation } from '../services/gemini';

interface ChartExplanationProps {
  chartType: string;
  dataKeys: {
    xAxisKey?: string;
    yAxisKey?: string;
    yAxisKey1?: string;
    yAxisKey2?: string;
    categoryKey?: string;
    valueKey?: string;
  };
  chartData: any[];
  insights?: any;
  className?: string;
}

export const ChartExplanation: React.FC<ChartExplanationProps> = ({
  chartType,
  dataKeys,
  chartData,
  insights,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExplain = async () => {
    if (!isOpen) {
      setIsOpen(true);
      if (!explanation) {
        setIsLoading(true);
        try {
          const aiExplanation = await generateChartExplanation({
            chartType,
            dataKeys,
            chartData: chartData.slice(0, 5), // Send only first 5 rows for context
            insights,
            dataSize: chartData.length
          });
          setExplanation(aiExplanation);
        } catch (error) {
          console.error('Error generating explanation:', error);
          setExplanation('Unable to generate explanation at this time. This chart visualizes your data to help identify patterns and insights.');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      setIsOpen(false);
    }
  };

  const formatExplanation = (text: string) => {
    if (!text.trim()) return [];
    
    const formattedContent: JSX.Element[] = [];
    
    // Split text into sections and process each
    const sections = text.split(/(?=\*\*[^*]+\*\*:?)/).filter(section => section.trim());
    
    sections.forEach((section, sectionIndex) => {
      const lines = section.split('\n').filter(line => line.trim());
      
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;
        
        const uniqueKey = `${sectionIndex}-${lineIndex}`;
        
        // Main section headings with ** **
        if (trimmedLine.match(/^\*\*[^*]+\*\*:?\s*$/)) {
          const heading = trimmedLine.replace(/\*\*/g, '').replace(/:$/, '');
          formattedContent.push(
            <div key={uniqueKey} className="mt-6 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h4 className="text-base font-semibold text-gray-900">
                  {heading}
                </h4>
              </div>
            </div>
          );
          return;
        }
        
        // Numbered or bullet points
        if (trimmedLine.match(/^\d+\.\s/) || trimmedLine.match(/^[•\*\-]\s/)) {
          const content = trimmedLine.replace(/^(\d+\.\s|[•\*\-]\s)/, '');
          const processedContent = processInlineFormatting(content);
          
          formattedContent.push(
            <div key={uniqueKey} className="flex items-start gap-3 mb-3 ml-4">
              <span className="text-blue-500 mt-1.5 text-xs">●</span>
              <div className="text-gray-700 leading-relaxed flex-1">
                {processedContent}
              </div>
            </div>
          );
          return;
        }
        
        // Paragraphs with potential inline formatting
        if (trimmedLine.length > 0) {
          const processedContent = processInlineFormatting(trimmedLine);
          formattedContent.push(
            <p key={uniqueKey} className="text-gray-700 leading-relaxed mb-4">
              {processedContent}
            </p>
          );
        }
      });
    });
    
    return formattedContent;
  };

  const processInlineFormatting = (text: string): (string | JSX.Element)[] => {
    if (!text.includes('**')) {
      return [text];
    }
    
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.replace(/\*\*/g, '');
        return (
          <strong key={index} className="font-semibold text-gray-900">
            {boldText}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Question Mark Button */}
      <button
        onClick={handleExplain}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 transition-all duration-200 shadow-sm hover:shadow-md"
        title="Explain this chart"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Explanation Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
                className="relative w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900">
                    Chart Explanation
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400 mb-3" />
                      <span className="text-sm text-gray-600">
                        Analyzing your chart...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="prose prose-sm max-w-none">
                        {formatExplanation(explanation)}
                      </div>
                      
                      {/* Chart Context */}
                      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Chart Details
                        </h4>
                        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="font-mono">{chartType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Data Points:</span>
                            <span className="font-mono">{chartData.length.toLocaleString()}</span>
                          </div>
                          {Object.entries(dataKeys).map(([key, value]) => 
                            value ? (
                              <div key={key} className="flex justify-between">
                                <span>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                <span className="font-mono text-right">{String(value).replace(/_/g, ' ')}</span>
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-center text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                    Powered by Qubit Dynamics
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};