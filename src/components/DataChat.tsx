"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Loader2, MessageSquare, X, ChevronDown, AlertTriangle } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { getChatCompletion } from '../services/gemini'; // Assuming this service handles streaming
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils'; // Your ClassName utility

// --- Interfaces ---

interface Message {
  id: string; // Add unique ID for key prop
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
}

// --- Helper Functions ---

// Improved Markdown Formatter with clean white theme styling
const formatMessageContent = (content: string) => {
  let formattedContent = content;

  // Headers with better spacing and hierarchy
  formattedContent = formattedContent.replace(
    /###\s*(.*?)(?:\n|$)/g,
    '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-4 border-b border-gray-200 pb-2 break-words leading-tight">$1</h3>'
  );
  
  formattedContent = formattedContent.replace(
    /##\s*(.*?)(?:\n|$)/g,
    '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-5 break-words leading-tight">$1</h2>'
  );

  // Main headers (single #)
  formattedContent = formattedContent.replace(
    /^#\s*(.*?)(?:\n|$)/gm,
    '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-6 break-words leading-tight">$1</h1>'
  );

  // Bold text with better styling
  formattedContent = formattedContent.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-semibold text-gray-900 bg-blue-50 px-2 py-1 rounded-md break-words">$1</strong>'
  );

  // Code blocks with better styling
  formattedContent = formattedContent.replace(
    /```([\s\S]*?)```/g,
    '<div class="bg-gray-900 border border-gray-800 rounded-lg p-4 my-4 font-mono text-sm overflow-x-auto shadow-inner"><code class="text-green-400 whitespace-pre-wrap block leading-relaxed">$1</code></div>'
  );

  // Inline code with better contrast
  formattedContent = formattedContent.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-800 text-green-300 px-2 py-1 rounded text-sm font-mono break-words shadow-sm">$1</code>'
  );

  // Enhanced numbered lists with better spacing
  formattedContent = formattedContent.replace(
    /^\s*(\d+)\.\s+(.*)/gm,
    '<div class="flex items-start gap-4 my-3 p-2 rounded-lg hover:bg-gray-50 transition-colors break-words"><span class="flex-shrink-0 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-0.5 shadow-sm">$1</span><span class="text-gray-700 flex-1 leading-relaxed pt-1">$2</span></div>'
  );

  // Enhanced unordered lists with better styling
  formattedContent = formattedContent.replace(
    /^\s*[-•]\s+(.*)/gm,
    '<div class="flex items-start gap-4 my-3 p-2 rounded-lg hover:bg-gray-50 transition-colors break-words"><span class="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2.5 shadow-sm"></span><span class="text-gray-700 flex-1 leading-relaxed">$1</span></div>'
  );

  // Enhanced key-value pairs with better visual separation
  formattedContent = formattedContent.replace(
    /^\s*([A-Za-z\s]+):\s*([^\n]+)/gm,
    '<div class="flex flex-col sm:flex-row gap-2 my-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400 break-words"><span class="font-semibold text-blue-700 flex-shrink-0 text-sm uppercase tracking-wide">$1:</span><span class="text-gray-800 flex-1 font-medium">$2</span></div>'
  );

  // Enhanced statistics formatting
  formattedContent = formattedContent.replace(
    /(\d+(?:\.\d+)?%)/g,
    '<span class="font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full text-sm whitespace-nowrap shadow-sm border border-green-200">$1</span>'
  );

  // Enhanced large numbers formatting
  formattedContent = formattedContent.replace(
    /\b(\d{1,3}(?:,\d{3})+|\d{4,})\b/g,
    '<span class="font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-md whitespace-nowrap shadow-sm">$1</span>'
  );

  // Section separators (--- or ***)
  formattedContent = formattedContent.replace(
    /^[\-\*]{3,}$/gm,
    '<hr class="my-6 border-t-2 border-gray-200" />'
  );

  // Quotes (> text)
  formattedContent = formattedContent.replace(
    /^>\s*(.*)/gm,
    '<blockquote class="border-l-4 border-blue-400 bg-blue-50 pl-4 py-3 my-4 italic text-gray-700 rounded-r-lg">$1</blockquote>'
  );

  // Tables (basic support for | separated values)
  formattedContent = formattedContent.replace(
    /\|(.+)\|/g,
    (match, content) => {
      const cells = content.split('|').map((cell: string) => cell.trim());
      const cellsHtml = cells.map((cell: string) => `<td class="px-3 py-2 border-b border-gray-200 text-sm">${cell}</td>`).join('');
      return `<table class="w-full my-4 bg-white rounded-lg shadow-sm border border-gray-200"><tr class="bg-gray-50">${cellsHtml}</tr></table>`;
    }
  );

  // Important notes or alerts (Note: text)
  formattedContent = formattedContent.replace(
    /^(Note|Important|Warning|Tip):\s*(.*)/gmi,
    '<div class="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3"><span class="font-semibold text-yellow-800 text-sm uppercase tracking-wide flex-shrink-0">$1:</span><span class="text-yellow-800 flex-1">$2</span></div>'
  );

  // Better paragraph spacing
  formattedContent = formattedContent.replace(
    /\n\n+/g,
    '<div class="my-4"></div>'
  );

  // Convert remaining single newlines to proper line breaks with spacing
  formattedContent = formattedContent.replace(/\n/g, '<br class="my-1" />');

  // If formatting fails, return plain text as fallback
  try {
    return (
      <div 
        className="prose prose-sm max-w-none leading-relaxed break-words overflow-wrap-anywhere space-y-1"
        dangerouslySetInnerHTML={{ __html: formattedContent }} 
      />
    );
  } catch (error) {
    console.error('Error in formatMessageContent:', error);
    return (
      <div className="prose prose-sm max-w-none leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap space-y-2 p-4 bg-gray-50 rounded-lg">
        {content}
      </div>
    );
  }
};

// --- Sub-Components ---

// Enhanced Typing Indicator Component with polished styling
const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-2 py-3 px-1">
    <span className="text-gray-400 text-sm font-medium">AI is thinking</span>
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-bounce [animation-delay:-0.3s] shadow-sm"></div>
      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-bounce [animation-delay:-0.15s] shadow-sm"></div>
      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-bounce shadow-sm"></div>
    </div>
  </div>
);

// Enhanced Streaming Indicator for when content is being typed
const StreamingIndicator: React.FC = () => (
  <div className="inline-flex items-center gap-2 ml-2 opacity-70">
    <span className="text-xs text-gray-400 font-medium">Generating</span>
    <div className="flex space-x-1">
      <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse"></div>
    </div>
  </div>
);

// Enhanced Message Item Component with clean white theme
interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isStreaming = message.isStreaming;
  
  console.log('Rendering message:', { id: message.id, content: message.content, isStreaming, isError });

  return (
    <motion.div
      initial={{ opacity: 0, y:15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.4, 0.0, 0.2, 1],
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={cn("flex gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3", isUser ? "justify-end" : "justify-start")}
    >
      {/* Avatar for AI messages */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
          <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
      )}

      <div
        className={cn(
          "relative w-full max-w-[90%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl transition-all duration-300 overflow-hidden backdrop-blur-sm",
          isUser
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-4 sm:ml-8 md:ml-12 shadow-lg shadow-blue-500/20"
            : isError
              ? "bg-gradient-to-br from-red-50 to-red-100 text-red-800 border border-red-200 shadow-md shadow-red-500/10"
              : "bg-white/95 text-gray-800 border border-gray-200/80 shadow-lg shadow-gray-900/5 hover:shadow-xl hover:shadow-gray-900/10",
          isStreaming && "animate-pulse-subtle ring-1 ring-blue-500/20"
        )}
      >
        {/* Error indicator */}
        {isError && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-red-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <span className="font-medium text-sm text-red-700">Error occurred</span>
          </div>
        )}

        {/* Message content */}
        <div className={cn(
          "px-3 sm:px-4 py-3 min-w-0 w-full",
          isError && "pt-2"
        )}>
          {message.content ? (
            <div className={cn(
              "text-sm leading-relaxed w-full min-w-0 overflow-hidden",
              isUser ? "text-white" : "text-gray-800"
            )}>
              {formatMessageContent(message.content)}
            </div>
          ) : isStreaming ? (
            <TypingIndicator />
          ) : (
            <div className="text-gray-500 italic text-sm">No response content</div>
          )}

          {/* Streaming indicator */}
          {isStreaming && message.content && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <StreamingIndicator />
            </div>
          )}
        </div>

        {/* Message timestamp */}
        <div className={cn(
          "px-4 pb-2 text-xs opacity-50 font-medium",
          isUser ? "text-blue-100" : "text-gray-400"
        )}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Speech bubble tail */}
        <div
          className={cn(
            "absolute top-4 w-3 h-3 transform rotate-45",
            isUser
              ? "-right-1.5 bg-gradient-to-br from-blue-500 to-blue-600"
              : "-left-1.5 bg-white/95 border-l border-t border-gray-200/80"
          )}
        />
      </div>

      {/* Avatar for user messages */}
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg ring-2 ring-white/20">
          <span className="text-white text-xs sm:text-sm font-semibold">U</span>
        </div>
      )}
    </motion.div>
  );
});
MessageItem.displayName = 'MessageItem';


// --- Main Chat Component ---

export const DataChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { processedData } = useDataStore();
  const [hasInteracted, setHasInteracted] = useState(false); // Track if user sent first message

  // Initial Welcome Message
  useEffect(() => {
    if (isOpen && messages.length === 0 && !hasInteracted && processedData) {
      const { summary } = processedData;
      
      // Generate dynamic suggested questions based on the data
      const suggestedQuestions = [
        `What are the key insights from this ${summary.rowCount}-row dataset?`,
        summary.numericalColumns.length > 0 ? `Analyze the trends in ${summary.numericalColumns[0]}` : null,
        summary.categoricalColumns.length > 0 ? `What's the distribution of ${summary.categoricalColumns[0]}?` : null,
        summary.numericalColumns.length > 1 ? `Compare ${summary.numericalColumns[0]} and ${summary.numericalColumns[1]}` : null,
        "What patterns or outliers do you notice in the data?",
        "Summarize the most important findings from this dataset"
      ].filter(Boolean);

      const welcomeMessage = `Hello! I'm your data analysis assistant. I've analyzed your DataSet.
      Feel free to ask anything about your data `;

      setMessages([
        {
          id: 'initial-bot-message',
          role: 'assistant',
          content: welcomeMessage,
        },
      ]);
    }
  }, [isOpen, messages.length, hasInteracted, processedData]);


  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      // Use smooth scroll for better UX
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]); // Trigger on messages change

  // Focus input when chat opens
   useEffect(() => {
    if (isOpen && inputRef.current) {
      // Delay slightly to allow animation to complete
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150); // Adjust delay as needed
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prepare comprehensive context for the AI with accurate business data
  const getDataContext = useCallback((): string => {
    if (!processedData) return 'No data loaded.';

    const { summary, rows } = processedData;
    
    // Increase sample size for better analysis context (10-50 rows depending on dataset size)
    const sampleSize = Math.min(Math.max(50, Math.floor(rows.length * 0.05)), 100);
    const sampleRows = rows.slice(0, sampleSize);
    
    // Format sample data in a more structured way
    const sampleDataString = sampleRows.map((row, index) => {
      const rowData = summary.headers.map(header => {
        const value = row[header];
        // Better value formatting for readability
        if (typeof value === 'number') {
          return `${header}: ${value.toLocaleString()}`;
        }
        return `${header}: "${value}"`;
      }).join(', ');
      return `Row ${index + 1}: {${rowData}}`;
    }).join('\n');
    
    // Enhanced statistical summary with business-focused metrics
    const statisticalSummary = Object.entries(summary.columnStats)
      .map(([col, stats]) => {
        if (!stats || Object.keys(stats).length === 0) return `- ${col}: No statistics available`;
        
        const isNumerical = summary.numericalColumns.includes(col);
        
        if (isNumerical) {
          // Enhanced numerical statistics with business context
          const statEntries = Object.entries(stats)
            .filter(([key]) => ['min', 'max', 'mean', 'median', 'stdDev', 'totalCount'].includes(key));
          
          const formattedStats = statEntries.map(([key, value]) => {
            if (typeof value === 'number') {
              // Format based on column name for better business context
              if (col.toLowerCase().includes('price') || col.toLowerCase().includes('sales') || col.toLowerCase().includes('revenue')) {
                return `${key}: ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              } else if (col.toLowerCase().includes('quantity') || col.toLowerCase().includes('count')) {
                return `${key}: ${Math.round(value).toLocaleString()}`;
              }
              return `${key}: ${value.toFixed(2)}`;
            }
            return `${key}: ${value}`;
          }).join(', ');
          
          // Add business context for key metrics
          let businessContext = '';
          if (col.toLowerCase().includes('sales') || col.toLowerCase().includes('revenue')) {
            const mean = stats.mean || 0;
            const total = (stats.totalCount || 0) * mean;
            businessContext = `\n    📊 Business Insight: Total ${col} = ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          }
          
          return `- ${col} (numerical): ${formattedStats}${businessContext}`;
        } else {
          // Enhanced categorical statistics with business insights
          const { uniqueValues, mostCommon, totalCount, valueCounts } = stats;
          
          let categoryInfo = `- ${col} (categorical): ${uniqueValues} unique values, ${totalCount} total entries`;
          
          if (mostCommon && mostCommon.length > 0) {
            categoryInfo += '\n  📋 Value Distribution:';
            mostCommon.slice(0, 10).forEach(({ value, count, percentage }) => {
              categoryInfo += `\n    • "${value}": ${count.toLocaleString()} times (${percentage.toFixed(1)}%)`;
            });
            
            // Business-specific quick reference for important categorical fields
            if (valueCounts && (
              col.toLowerCase().includes('product') || 
              col.toLowerCase().includes('category') || 
              col.toLowerCase().includes('segment') ||
              col.toLowerCase().includes('province') ||
              col.toLowerCase().includes('region') ||
              col.toLowerCase().includes('type')
            )) {
              categoryInfo += `\n  🎯 Business Categories (${col}):`;
              Object.entries(valueCounts).slice(0, 15).forEach(([value, count]) => {
                categoryInfo += `\n    • ${value}: ${count.toLocaleString()} records`;
              });
            }
          }
          
          return categoryInfo;
        }
      })
      .join('\n');
    
    // Calculate business-specific aggregations
    const businessMetrics = (() => {
      try {
        // Identify key business columns
        const salesColumns = summary.headers.filter(h => 
          h.toLowerCase().includes('sales') || 
          h.toLowerCase().includes('revenue') || 
          h.toLowerCase().includes('amount')
        );
        
        const quantityColumns = summary.headers.filter(h => 
          h.toLowerCase().includes('quantity') || 
          h.toLowerCase().includes('volume') || 
          h.toLowerCase().includes('liter')
        );
        
        const dateColumns = summary.headers.filter(h => 
          h.toLowerCase().includes('date') || 
          h.toLowerCase().includes('time') || 
          h.toLowerCase().includes('month') ||
          h.toLowerCase().includes('quarter')
        );
        
        const productColumns = summary.headers.filter(h => 
          h.toLowerCase().includes('product') || 
          h.toLowerCase().includes('item')
        );
        
        const regionColumns = summary.headers.filter(h => 
          h.toLowerCase().includes('province') || 
          h.toLowerCase().includes('region') || 
          h.toLowerCase().includes('location')
        );

        let metrics = '\n🔍 BUSINESS ANALYSIS CONTEXT:\n';
        
        if (salesColumns.length > 0) {
          metrics += `- Sales/Revenue columns: ${salesColumns.join(', ')}\n`;
        }
        if (quantityColumns.length > 0) {
          metrics += `- Quantity/Volume columns: ${quantityColumns.join(', ')}\n`;
        }
        if (dateColumns.length > 0) {
          metrics += `- Time-based columns: ${dateColumns.join(', ')}\n`;
        }
        if (productColumns.length > 0) {
          metrics += `- Product-related columns: ${productColumns.join(', ')}\n`;
        }
        if (regionColumns.length > 0) {
          metrics += `- Geographic columns: ${regionColumns.join(', ')}\n`;
        }

        // Calculate transaction-level metrics if possible
        if (salesColumns.length > 0 && rows.length > 0) {
          const salesCol = salesColumns[0];
          const salesValues = rows.map(row => Number(row[salesCol]) || 0).filter(val => val > 0);
          
          if (salesValues.length > 0) {
            const totalSales = salesValues.reduce((sum, val) => sum + val, 0);
            const avgTransaction = totalSales / salesValues.length;
            const transactions = salesValues.length;
            
            metrics += `\n💰 KEY BUSINESS METRICS:\n`;
            metrics += `- Total Transactions: ${transactions.toLocaleString()}\n`;
            metrics += `- Total Sales Value: ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
            metrics += `- Average Transaction Value: ${avgTransaction.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
          }
        }

        return metrics;
      } catch (error) {
        return '\n🔍 BUSINESS ANALYSIS CONTEXT: Unable to calculate advanced metrics\n';
      }
    })();

    // Enhanced context with comprehensive business data
    const context = `
📊 COMPREHENSIVE DATASET ANALYSIS CONTEXT

DATASET OVERVIEW:
- Total Rows: ${summary.rowCount.toLocaleString()}
- Total Columns: ${summary.columnCount}
- Data Density: ${summary.numericalColumns.length} numerical and ${summary.categoricalColumns.length} categorical columns
- Sample Size Provided: ${sampleSize} rows (${((sampleSize/summary.rowCount)*100).toFixed(1)}% of dataset)

COLUMN STRUCTURE:
📈 Numerical Columns (${summary.numericalColumns.length}): ${summary.numericalColumns.length > 0 ? summary.numericalColumns.join(', ') : 'None'}
📋 Categorical Columns (${summary.categoricalColumns.length}): ${summary.categoricalColumns.length > 0 ? summary.categoricalColumns.join(', ') : 'None'}

COMPREHENSIVE STATISTICAL SUMMARY:
${statisticalSummary}
${businessMetrics}

📋 REPRESENTATIVE SAMPLE DATA (First ${sampleSize} rows):
${sampleDataString}

🎯 ANALYSIS CAPABILITIES & INSTRUCTIONS:

FOR BUSINESS ANALYTICS QUESTIONS:
1. **Average Sales Analysis**: Calculate average transaction values using numerical sales columns
2. **Product Performance**: Compare categories using product and sales data  
3. **Revenue per Unit**: Calculate revenue/liter ratios using quantity and sales columns
4. **Temporal Analysis**: Identify seasonal patterns using date/time columns
5. **Segmentation**: Analyze performance across regions, product types, customer segments

ACCURACY REQUIREMENTS:
- Use ACTUAL DATA from the sample and statistics provided above
- Reference specific column names and values from the dataset
- Calculate percentages, averages, and totals based on real numbers
- Identify trends using the time-based columns if available
- Compare performance using categorical breakdowns (regions, products, etc.)

RESPONSE FORMAT:
- Start with specific numerical findings
- Reference actual column names and values
- Provide actionable business insights
- Use the statistical summaries for accurate calculations
- Mention data limitations if sample size affects conclusions

IMPORTANT: This dataset contains ${summary.rowCount.toLocaleString()} real business records. Use the provided statistics and sample data to give accurate, data-driven responses. When calculating averages, totals, or comparisons, reference the actual statistical values provided above.
    `.trim();

    return context;
  }, [processedData]);


  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim()) return;
    if (!processedData) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Please upload and process a CSV file first before asking questions.',
        isError: true,
      }]);
      return;
    }

    setHasInteracted(true); // Mark interaction

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInput(''); // Clear input immediately
    setIsLoading(true);

    // Add placeholder for streaming bot response
    const botMessageId = `bot-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: botMessageId,
      role: 'assistant',
      content: '', // Start empty
      isStreaming: true,
    }]);

     // Reset textarea height after sending
     if (inputRef.current) {
        inputRef.current.style.height = 'auto'; // Reset height before sending
     }


    try {
      let accumulatedContent = "";
      await getChatCompletion(
        messageContent,
        getDataContext(),
        (chunk) => {
          console.log('Received chunk:', chunk);
          accumulatedContent += chunk;
          console.log('Accumulated content:', accumulatedContent);
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId ? { ...msg, content: accumulatedContent } : msg
          ));
        }
      );

      // Finalize the bot message (streaming complete)
      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId ? { ...msg, isStreaming: false } : msg
      ));

    } catch (error: unknown) {
      console.error('Chat completion error:', error);

      let errorMessage = 'Sorry, an unexpected error occurred.';
       if (error instanceof Error) {
          // Provide slightly more context without exposing sensitive details
          if (error.message.includes('API key') || error.message.includes('permission')) {
             errorMessage = 'There seems to be an issue connecting to the AI service (Configuration Error). Please contact support.';
          } else if (error.message.includes('404') || error.message.includes('fetch')) {
             errorMessage = 'Could not reach the AI service. Please check your connection or try again later.';
          } else if (error.message.includes('timeout')) {
             errorMessage = 'The request timed out. The AI service might be busy. Please try again.';
          } else {
             errorMessage = `An error occurred while processing your request. Please try again.`;
          }
       }


      // Update the placeholder message with the error
      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? { ...msg, content: errorMessage, isStreaming: false, isError: true }
          : msg
      ));
    } finally {
      setIsLoading(false);
       // Re-focus input after response/error
      inputRef.current?.focus();
    }
  }, [processedData, getDataContext]); // Add dependencies


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'; // Reset height
      const scrollHeight = inputRef.current.scrollHeight;
      const maxHeight = 120; // Max height in pixels (match style.maxHeight)
      inputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  // Allow Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

   // Don't render the chat toggle/window if no data is processed yet
   if (!processedData) return null;

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "fixed bottom-0 right-0 z-[100] flex flex-col border border-gray-200/60 bg-white/95 backdrop-blur-xl",
              "md:bottom-6 md:right-6 md:rounded-2xl",
              "overflow-hidden ring-1 ring-gray-900/5",
              isExpanded
                ? "h-[calc(100svh-1rem)] w-[calc(100vw-1rem)] md:h-[75vh] md:w-[600px]"
                : "h-[70vh] w-[calc(100vw-1rem)] md:h-[550px] md:w-[450px]"
            )}
            style={{
                boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(255 255 255 / 0.05)',
            }}
          >
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-200/60 p-4 bg-gradient-to-r from-gray-50/90 to-white/90 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 border-2 border-white flex items-center justify-center shadow-md">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Data Analyst AI</h3>
                  <p className="text-xs text-gray-500 font-medium">Powered by Qubit Dynamics • <span className="text-emerald-500">Online</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse Chat" : "Expand Chat"}
                  aria-label={isExpanded ? "Collapse Chat" : "Expand Chat"}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-all duration-200 rounded-lg hover:bg-gray-100/80 group backdrop-blur-sm"
                >
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-all duration-300 group-hover:scale-110", 
                    isExpanded && "rotate-180"
                  )} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Chat"
                  aria-label="Close Chat"
                  className="p-2 text-gray-400 hover:text-red-500 transition-all duration-200 rounded-lg hover:bg-red-50/80 group backdrop-blur-sm"
                >
                  <X className="h-4 w-4 transition-all duration-200 group-hover:scale-110" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto py-2 space-y-1 scroll-smooth bg-gray-50/30"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#e5e7eb transparent'
              }}
            >
              
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <MessageItem key={message.id} message={message} />
                ))}
              </AnimatePresence>
              
              {/* Loading placeholder */}
              {isLoading && messages.length > 0 && !messages[messages.length - 1]?.isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 shadow-sm">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white">
              {/* Quick Questions (show only when no messages or just welcome message) */}
              {messages.length <= 1 && processedData && (
                <div className="p-4 pb-3 border-b border-gray-100/80">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Quick Questions
                    </h4>
                  </div>
                  
                  {/* Quick Actions Row */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      "Summarize this data",
                      processedData.summary.numericalColumns.length > 0 ? `Analyze ${processedData.summary.numericalColumns[0]}` : null,
                      "Find patterns"
                    ].filter((q): q is string => Boolean(q)).map((question, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleSendMessage(question)}
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group px-3 py-1.5 text-xs bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 hover:text-blue-800 rounded-full transition-all duration-200 border border-blue-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
                      >
                        <span className="relative z-10">{question}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Business Analytics Questions */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Business Analytics</h5>
                    <div className="grid gap-2">
                      {[
                        "What is the average sales value per transaction over time and across segments?",
                        "How do premium vs. standard products perform in terms of sales and volume?",
                        "What is the revenue generated per liter across product categories and customer segments?",
                        "Which months or quarters show peak or off-peak sales, and how does stock adjust accordingly?"
                      ].map((question, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleSendMessage(question)}
                          disabled={isLoading}
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          className="group text-left p-3 text-sm bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300 flex items-center justify-center mt-0.5">
                              <span className="text-xs font-bold text-emerald-700">{index + 1}</span>
                            </div>
                            <span className="leading-relaxed">{question}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything about your data..."
                      disabled={isLoading}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 min-h-[44px] max-h-[120px] transition-all duration-200"
                      rows={1}
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                      {input.length}/1000
                    </div>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-500 text-white transition-all duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center shadow-sm group"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    )}
                  </motion.button>
                </form>
                
                {/* Helper text */}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Press Shift+Enter for new line</span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    AI Ready
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Toggle Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full blur-lg opacity-30 group-hover:opacity-40 transition-opacity duration-300" />
          
          {/* Icon */}
          <div className="relative">
            <MessageSquare className="h-6 w-6 text-white transition-transform group-hover:scale-110" />
            
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse">
              <div className="w-full h-full bg-green-400 rounded-full animate-ping" />
            </div>
          </div>
        </motion.button>
      </motion.div>
    </>
  );
};