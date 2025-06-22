import React, { useState } from 'react';
import { X, Loader2, TrendingUp, AlertTriangle, Target, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIActivatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading: boolean;
  activatorType: 'sales_forecast' | 'anomaly_detection' | 'whatif_simulation' | 'customer_insights';
}

const getActivatorIcon = (type: string) => {
  switch (type) {
    case 'sales_forecast':
      return TrendingUp;
    case 'anomaly_detection':
      return AlertTriangle;
    case 'whatif_simulation':
      return Target;
    case 'customer_insights':
      return Users;
    default:
      return TrendingUp;
  }
};

const getActivatorColor = (type: string) => {
  switch (type) {
    case 'sales_forecast':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'anomaly_detection':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'whatif_simulation':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'customer_insights':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200';
  }
};

export const AIActivatorModal: React.FC<AIActivatorModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  isLoading,
  activatorType
}) => {
  const IconComponent = getActivatorIcon(activatorType);
  const colorClasses = getActivatorColor(activatorType);

  const formatContent = (text: string) => {
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
        
        // Main section headers
        if (trimmedLine.match(/^\*\*[^*]+\*\*:?\s*/)) {
          const heading = trimmedLine.replace(/\*\*/g, '').replace(/:$/, '');
          
          // Special styling for key sections
          if (heading.includes('Summary') || heading.includes('Impact')) {
            const content = trimmedLine.replace(/^\*\*[^*]+\*\*:?\s*/, '');
            formattedContent.push(
              <div key={uniqueKey} className={`mb-6 p-4 rounded-lg border-l-4 ${colorClasses}`}>
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className="w-4 h-4" />
                  <h4 className="text-sm font-semibold uppercase tracking-wide">
                    {heading}
                  </h4>
                </div>
                <p className="font-medium leading-relaxed">
                  {content}
                </p>
              </div>
            );
            return;
          }
          
          // Regular section headers
          formattedContent.push(
            <div key={uniqueKey} className="mt-5 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  {heading}
                </h4>
              </div>
            </div>
          );
          return;
        }
        
        // Bullet points
        if (trimmedLine.match(/^[•\*\-]\s/)) {
          const content = trimmedLine.replace(/^[•\*\-]\s/, '');
          const processedContent = processInlineFormatting(content);
          
          formattedContent.push(
            <div key={uniqueKey} className="flex items-start gap-3 mb-2 ml-3">
              <span className="text-blue-500 mt-1.5 text-xs font-bold">●</span>
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
            <p key={uniqueKey} className="text-gray-700 leading-relaxed mb-3 text-sm">
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
              className="relative w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorClasses}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
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
                      Analyzing your data with AI...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="prose prose-sm max-w-none">
                      {formatContent(content)}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                  Powered by Gemini AI
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}; 