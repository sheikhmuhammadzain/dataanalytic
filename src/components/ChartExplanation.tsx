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
          setExplanation('**Business Impact:** Unable to generate insights at this time.\n\n**Key Insights:**\n• This chart visualizes your data patterns\n• Review the data for trends and opportunities\n• Consider data quality and completeness\n\n**Recommended Action:** Ensure data quality and try again later.');
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
        
        // Business Impact section - clean minimal styling
        if (trimmedLine.match(/^\*\*Business Impact\*\*:?\s*/)) {
          const content = trimmedLine.replace(/^\*\*Business Impact\*\*:?\s*/, '');
          formattedContent.push(
            <div key={uniqueKey} className="mb-4 p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg">
              <h4 className="text-xs font-medium text-blue-700 mb-1.5 uppercase tracking-wider">
                Business Impact
              </h4>
              <p className="text-sm text-blue-900 leading-relaxed">
                {content}
              </p>
            </div>
          );
          return;
        }
        
        // Recommended Action section - clean minimal styling
        if (trimmedLine.match(/^\*\*Recommended Action\*\*:?\s*/)) {
          const content = trimmedLine.replace(/^\*\*Recommended Action\*\*:?\s*/, '');
          formattedContent.push(
            <div key={uniqueKey} className="mt-4 p-3 bg-green-50/50 border border-green-200/50 rounded-lg">
              <h4 className="text-xs font-medium text-green-700 mb-1.5 uppercase tracking-wider">
                Recommended Action
              </h4>
              <p className="text-sm text-green-900 leading-relaxed">
                {content}
              </p>
            </div>
          );
          return;
        }
        
        // Other section headings with ** **
        if (trimmedLine.match(/^\*\*[^*]+\*\*:?\s*$/)) {
          const heading = trimmedLine.replace(/\*\*/g, '').replace(/:$/, '');
          formattedContent.push(
            <div key={uniqueKey} className="mt-4 mb-2">
              <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1">
                {heading}
              </h4>
            </div>
          );
          return;
        }
        
        // Bullet points with minimal styling
        if (trimmedLine.match(/^[•\*\-]\s/)) {
          const content = trimmedLine.replace(/^[•\*\-]\s/, '');
          const processedContent = processInlineFormatting(content);
          
          formattedContent.push(
            <div key={uniqueKey} className="flex items-start gap-2 mb-2">
              <span className="text-gray-400 mt-1 text-xs">•</span>
              <div className="text-gray-700 leading-relaxed flex-1 text-sm">
                {processedContent}
              </div>
            </div>
          );
          return;
        }
        
        // Regular paragraphs
        if (trimmedLine.length > 0 && !trimmedLine.startsWith('**')) {
          const processedContent = processInlineFormatting(trimmedLine);
          formattedContent.push(
            <p key={uniqueKey} className="text-gray-700 leading-relaxed mb-2 text-sm">
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
          <span key={index} className="font-medium text-gray-900">
            {boldText}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={className?.includes('static') ? className : `relative ${className}`}>
      {/* Question Mark Button */}
      <button
        onClick={handleExplain}
        className={className?.includes('static') 
          ? "p-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-700 transition-all duration-200"
          : "absolute top-2 right-2 z-10 p-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-700 transition-all duration-200"
        }
        title="Chart insights"
      >
        <HelpCircle className="w-3.5 h-3.5" />
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
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ type: "spring", duration: 0.25, bounce: 0.05 }}
                className="relative w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900">Chart Insights</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 py-3 max-h-[65vh] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">
                        Analyzing data...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {formatExplanation(explanation)}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/30">
                  <div className="flex items-center justify-center text-xs text-gray-400">
                    AI-powered insights
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