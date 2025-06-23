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
    
    // Split content into lines and process each line
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      const uniqueKey = `line-${index}`;
      
      // Main headers (### or ##)
      if (trimmedLine.match(/^#{2,3}\s+/)) {
        const headerText = trimmedLine.replace(/^#+\s+/, '');
        const level = trimmedLine.match(/^(#+)/)?.[1].length || 2;
        
        if (level === 2) {
          formattedContent.push(
            <h2 key={uniqueKey} className="text-lg font-bold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-gray-200">
              {headerText}
            </h2>
          );
        } else {
          formattedContent.push(
            <h3 key={uniqueKey} className="text-base font-semibold text-gray-900 mt-6 mb-3">
              {headerText}
            </h3>
          );
        }
        return;
      }
      
      // Bold section headers (**TEXT**)
      if (trimmedLine.match(/^\*\*[^*]+\*\*:?\s*$/)) {
        const heading = trimmedLine.replace(/\*\*/g, '').replace(/:$/, '');
        formattedContent.push(
          <div key={uniqueKey} className="mt-6 mb-3">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide bg-gray-50 px-3 py-2 rounded-md border-l-4 border-blue-500">
              {heading}
            </h4>
          </div>
        );
        return;
      }
      
      // Bullet points (•, *, -)
      if (trimmedLine.match(/^[•\*\-]\s+/)) {
        const bulletContent = trimmedLine.replace(/^[•\*\-]\s+/, '');
        const processedContent = processInlineFormatting(bulletContent);
        
        formattedContent.push(
          <div key={uniqueKey} className="flex items-start gap-3 mb-3 ml-4">
            <span className="text-blue-600 mt-1 text-sm font-bold flex-shrink-0">•</span>
            <div className="text-gray-700 leading-relaxed text-sm flex-1">
              {processedContent}
            </div>
          </div>
        );
        return;
      }
      
      // Numbered lists (1., 2., etc.)
      if (trimmedLine.match(/^\d+\.\s+/)) {
        const numberMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        if (numberMatch) {
          const [, number, content] = numberMatch;
          const processedContent = processInlineFormatting(content);
          
          formattedContent.push(
            <div key={uniqueKey} className="flex items-start gap-3 mb-3 ml-4">
              <span className="text-blue-600 mt-1 text-sm font-semibold flex-shrink-0 bg-blue-50 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                {number}
              </span>
              <div className="text-gray-700 leading-relaxed text-sm flex-1">
                {processedContent}
              </div>
            </div>
          );
        }
        return;
      }
      
      // Special highlighted sections
      if (trimmedLine.match(/^\*\*[^*]+\*\*:\s*.+/)) {
        const match = trimmedLine.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
        if (match) {
          const [, label, content] = match;
          const processedContent = processInlineFormatting(content);
          
          formattedContent.push(
            <div key={uniqueKey} className={`mb-4 p-4 rounded-lg border-l-4 ${colorClasses}`}>
              <div className="flex items-start gap-2">
                <IconComponent className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 mb-1">
                    {label}
                  </h5>
                  <div className="text-gray-700 text-sm leading-relaxed">
                    {processedContent}
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return;
      }
      
      // Regular paragraphs
      if (trimmedLine.length > 0) {
        const processedContent = processInlineFormatting(trimmedLine);
        formattedContent.push(
          <p key={uniqueKey} className="text-gray-700 leading-relaxed mb-4 text-sm">
            {processedContent}
          </p>
        );
      }
    });
    
    return formattedContent;
  };

  const processInlineFormatting = (text: string): (string | JSX.Element)[] => {
    if (!text.includes('**') && !text.includes('*')) {
      return [text];
    }
    
    // Handle both bold (**text**) and italic (*text*)
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
    
    return parts.map((part, index) => {
      // Bold text
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.replace(/\*\*/g, '');
        return (
          <strong key={index} className="font-semibold text-gray-900 bg-blue-50 px-1 rounded">
            {boldText}
          </strong>
        );
      }
      // Italic text
      if (part.startsWith('*') && part.endsWith('*') && !part.includes('**')) {
        const italicText = part.replace(/\*/g, '');
        return (
          <em key={index} className="italic text-gray-600">
            {italicText}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Container - Centered in viewport */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
              className="relative w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col pointer-events-auto"
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
              <div className="px-6 py-4 flex-1 overflow-y-auto">
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