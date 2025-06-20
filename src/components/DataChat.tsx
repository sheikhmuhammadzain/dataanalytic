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

// Improved Markdown Formatter with better styling
const formatMessageContent = (content: string) => {
  let formattedContent = content;

  // Headers (### and ##)
  formattedContent = formattedContent.replace(
    /###\s*(.*?)(?:\n|$)/g,
    '<h3 class="text-lg font-bold text-white mt-6 mb-3 border-b border-zinc-600/30 pb-2">$1</h3>'
  );
  
  formattedContent = formattedContent.replace(
    /##\s*(.*?)(?:\n|$)/g,
    '<h2 class="text-xl font-bold text-white mt-6 mb-4">$1</h2>'
  );

  // Bold (**text**)
  formattedContent = formattedContent.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-semibold text-white bg-zinc-700/30 px-1 py-0.5 rounded">$1</strong>'
  );

  // Code blocks (```code```)
  formattedContent = formattedContent.replace(
    /```([\s\S]*?)```/g,
    '<div class="bg-zinc-800/50 border border-zinc-600/30 rounded-lg p-3 my-3 font-mono text-sm overflow-x-auto"><code class="text-green-300">$1</code></div>'
  );

  // Inline code (`code`)
  formattedContent = formattedContent.replace(
    /`([^`]+)`/g,
    '<code class="bg-zinc-700/50 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  );

  // Numbered lists (1. item)
  formattedContent = formattedContent.replace(
    /^\s*(\d+)\.\s+(.*)/gm,
    '<div class="flex items-start gap-3 my-2"><span class="flex-shrink-0 w-6 h-6 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center text-xs font-semibold">$1</span><span class="text-zinc-200">$2</span></div>'
  );

  // Unordered lists (- item or • item)
  formattedContent = formattedContent.replace(
    /^\s*[-•]\s+(.*)/gm,
    '<div class="flex items-start gap-3 my-2"><span class="flex-shrink-0 w-2 h-2 bg-indigo-400 rounded-full mt-2"></span><span class="text-zinc-200">$1</span></div>'
  );

  // Key-value pairs (key: value)
  formattedContent = formattedContent.replace(
    /^\s*([A-Za-z\s]+):\s*([^\n]+)/gm,
    '<div class="flex gap-2 my-1"><span class="font-medium text-indigo-300 min-w-fit">$1:</span><span class="text-zinc-200">$2</span></div>'
  );

  // Statistics formatting (numbers with %)
  formattedContent = formattedContent.replace(
    /(\d+(?:\.\d+)?%)/g,
    '<span class="font-semibold text-green-400 bg-green-400/10 px-1 py-0.5 rounded">$1</span>'
  );

  // Large numbers formatting
  formattedContent = formattedContent.replace(
    /\b(\d{1,3}(?:,\d{3})+|\d{4,})\b/g,
    '<span class="font-semibold text-blue-300">$1</span>'
  );

  // Newlines to line breaks
  formattedContent = formattedContent.replace(/\n/g, '<br />');

  return (
    <div 
      className="prose prose-sm max-w-none leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formattedContent }} 
    />
  );
};

// --- Sub-Components ---

// Enhanced Typing Indicator Component with better animation
const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1.5 py-2">
    <span className="text-zinc-400 text-sm mr-2">AI is thinking</span>
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
    </div>
  </div>
);

// Enhanced Streaming Indicator for when content is being typed
const StreamingIndicator: React.FC = () => (
  <div className="inline-flex items-center gap-2 ml-2 opacity-60">
    <div className="flex space-x-1">
      <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></div>
    </div>
  </div>
);

// Enhanced Message Item Component with improved styling
interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isStreaming = message.isStreaming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.4, 0.0, 0.2, 1],
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={cn("flex gap-3 px-4 py-3", isUser ? "justify-end" : "justify-start")}
    >
      {/* Avatar for AI messages */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div
        className={cn(
          "relative max-w-[85%] rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-200",
          isUser
            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white ml-12"
            : isError
              ? "bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-100 border border-red-500/30"
              : "bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 text-zinc-100 border border-zinc-700/50",
          isStreaming && "animate-pulse-subtle"
        )}
      >
        {/* Error indicator */}
        {isError && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-red-500/20">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400" />
            <span className="font-medium text-sm text-red-300">Error occurred</span>
          </div>
        )}

        {/* Message content */}
        <div className={cn(
          "px-4 py-3",
          isError && "pt-2"
        )}>
          {message.content ? (
            <div className={cn(
              "text-sm leading-relaxed",
              isUser ? "text-white" : "text-zinc-100"
            )}>
              {formatMessageContent(message.content)}
            </div>
          ) : isStreaming ? (
            <TypingIndicator />
          ) : null}

          {/* Streaming indicator */}
          {isStreaming && message.content && (
            <div className="mt-2 pt-2 border-t border-zinc-600/30">
              <StreamingIndicator />
            </div>
          )}
        </div>

        {/* Message timestamp (optional) */}
        <div className={cn(
          "px-4 pb-2 text-xs opacity-60",
          isUser ? "text-indigo-100" : "text-zinc-400"
        )}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Speech bubble tail */}
        <div
          className={cn(
            "absolute top-4 w-3 h-3 transform rotate-45",
            isUser
              ? "-right-1.5 bg-gradient-to-br from-indigo-600 to-indigo-700"
              : "-left-1.5 bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 border-l border-t border-zinc-700/50"
          )}
        />
      </div>

      {/* Avatar for user messages */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
          <span className="text-white text-sm font-semibold">U</span>
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

      const welcomeMessage = `Hello! I'm your data analysis assistant. I've analyzed your CSV file with ${summary.rowCount} rows and ${summary.columnCount} columns.

**Here are some questions you can ask me:**
${suggestedQuestions.slice(0, 4).map(q => `• ${q}`).join('\n')}

Feel free to ask anything about your data - trends, patterns, statistics, or specific insights!`;

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

  // Prepare context for the AI
  const getDataContext = useCallback((): string => {
    if (!processedData) return 'No data loaded.';

    const { summary, rows } = processedData;
    
    // Get sample data rows for better context
    const sampleSize = Math.min(5, rows.length);
    const sampleRows = rows.slice(0, sampleSize);
    
    // Format sample data for context
    const sampleDataString = sampleRows.map((row, index) => {
      const rowData = summary.headers.map(header => `${header}: ${row[header]}`).join(', ');
      return `Row ${index + 1}: {${rowData}}`;
    }).join('\n');
    
    // Enhanced statistical summary with categorical distributions
    const statisticalSummary = Object.entries(summary.columnStats)
      .map(([col, stats]) => {
        if (!stats || Object.keys(stats).length === 0) return `- ${col}: No statistics available`;
        
        const isNumerical = summary.numericalColumns.includes(col);
        
        if (isNumerical) {
          // Numerical statistics
          const statEntries = Object.entries(stats)
            .filter(([key]) => ['min', 'max', 'mean', 'median', 'stdDev'].includes(key));
          const formattedStats = statEntries.map(([key, value]) => {
            if (typeof value === 'number') {
              return `${key}: ${value.toFixed(2)}`;
            }
            return `${key}: ${value}`;
          }).join(', ');
          
          return `- ${col} (numerical): ${formattedStats}, total: ${stats.totalCount || 0} values`;
        } else {
          // Categorical statistics with value counts
          const { uniqueValues, mostCommon, totalCount, valueCounts } = stats;
          
          let categoryInfo = `- ${col} (categorical): ${uniqueValues} unique values, ${totalCount} total entries`;
          
          if (mostCommon && mostCommon.length > 0) {
            categoryInfo += '\n  Value distribution:';
            mostCommon.slice(0, 5).forEach(({ value, count, percentage }) => {
              categoryInfo += `\n    • "${value}": ${count} times (${percentage.toFixed(1)}%)`;
            });
            
            // Add specific counts for common status-like fields
            if (valueCounts && (col.toLowerCase().includes('status') || col.toLowerCase().includes('state') || col.toLowerCase().includes('type'))) {
              categoryInfo += '\n  Quick reference:';
              Object.entries(valueCounts).forEach(([value, count]) => {
                categoryInfo += `\n    • ${value}: ${count}`;
              });
            }
          }
          
          return categoryInfo;
        }
      })
      .join('\n');
    
    // Enhanced context with more detailed information
    const context = `
DATASET OVERVIEW:
- Total Rows: ${summary.rowCount}
- Total Columns: ${summary.columnCount}
- File contains ${summary.numericalColumns.length} numerical and ${summary.categoricalColumns.length} categorical columns

COLUMN INFORMATION:
Numerical Columns: ${summary.numericalColumns.length > 0 ? summary.numericalColumns.join(', ') : 'None'}
Categorical Columns: ${summary.categoricalColumns.length > 0 ? summary.categoricalColumns.join(', ') : 'None'}

DETAILED STATISTICAL SUMMARY:
${statisticalSummary}

SAMPLE DATA (First ${sampleSize} rows):
${sampleDataString}

DATA INSIGHTS:
- Dataset has ${summary.rowCount} records across ${summary.columnCount} different attributes
- Numerical analysis available for: ${summary.numericalColumns.join(', ') || 'No numerical columns'}
- Categorical analysis available for: ${summary.categoricalColumns.join(', ') || 'No categorical columns'}
${summary.rowCount > 1000 ? `- Large dataset with ${summary.rowCount} rows - statistical summaries provided above` : '- Medium-sized dataset suitable for detailed analysis'}
- Categorical value counts are provided above for frequency-based questions

ANALYSIS CAPABILITIES:
You can answer questions about:
- Specific counts (e.g., "How many tickets are closed?", "How many customers are active?")
- Distributions and percentages for categorical data
- Statistical analysis for numerical data
- Trends, patterns, and comparisons between columns
- Data quality and completeness

The user is asking questions about this dataset. Please provide accurate, data-driven responses based on the information above.
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
          accumulatedContent += chunk;
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
              "fixed bottom-0 right-0 z-[100] flex flex-col border border-zinc-700/50 bg-zinc-900/80 shadow-2xl backdrop-blur-lg", // Use zinc, increase z-index
              "md:bottom-6 md:right-6 md:rounded-xl", // Adjust positioning and rounding
              "overflow-hidden", // Important for containing content
              isExpanded
                ? "h-[calc(100svh-3rem)] w-full md:h-[75vh] md:w-[600px]" // Use svh for mobile, more height
                : "h-[65vh] w-full md:h-[550px] md:w-[400px]" // Adjusted default size
            )}
            style={{
                boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3), 0 5px 15px -10px rgba(79, 70, 229, 0.2)', // Softer shadow + accent glow
            }}
          >
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-zinc-700/50 p-4 bg-gradient-to-r from-zinc-800/95 to-zinc-900/95 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-800 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Data Analyst AI</h3>
                  <p className="text-xs text-zinc-400">Powered by Cybergen • Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse Chat" : "Expand Chat"}
                  aria-label={isExpanded ? "Collapse Chat" : "Expand Chat"}
                  className="p-2 text-zinc-400 hover:text-white transition-all duration-200 rounded-lg hover:bg-zinc-700/50 group"
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
                  className="p-2 text-zinc-400 hover:text-white transition-all duration-200 rounded-lg hover:bg-zinc-700/50 hover:bg-red-500/20 group"
                >
                  <X className="h-4 w-4 transition-all duration-200 group-hover:scale-110" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto py-2 space-y-1 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent"
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 rounded-2xl px-4 py-3 border border-zinc-700/50">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-zinc-700/50 bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm">
              {/* Quick Questions (show only when no messages or just welcome message) */}
              {messages.length <= 1 && processedData && (
                <div className="p-4 pb-2">
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Summarize this data",
                      processedData.summary.numericalColumns.length > 0 ? `Analyze ${processedData.summary.numericalColumns[0]}` : null,
                      "Find patterns",
                      "Show key insights"
                    ].filter((q): q is string => Boolean(q)).map((question, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleSendMessage(question)}
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group px-3 py-2 text-xs bg-gradient-to-r from-zinc-700/60 to-zinc-600/60 hover:from-indigo-600/60 hover:to-purple-600/60 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-600/30 hover:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                      >
                        <span className="relative z-10">{question}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" />
                      </motion.button>
                    ))}
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
                      className="w-full resize-none rounded-xl border border-zinc-600/50 bg-zinc-800/60 backdrop-blur-sm px-4 py-3 pr-12 text-sm text-zinc-100 placeholder-zinc-400 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 min-h-[44px] max-h-[120px] transition-all duration-200"
                      rows={1}
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-zinc-500">
                      {input.length}/1000
                    </div>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition-all duration-200 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center shadow-lg group"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    )}
                  </motion.button>
                </form>
                
                {/* Helper text */}
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>Press Shift+Enter for new line</span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
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
          className="group relative w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center animate-float"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300 animate-glow" />
          
          {/* Icon */}
          <div className="relative">
            <MessageSquare className="h-6 w-6 text-white transition-transform group-hover:scale-110" />
            
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse">
              <div className="w-full h-full bg-emerald-400 rounded-full animate-ping" />
            </div>
          </div>
        </motion.button>
      </motion.div>
    </>
  );
};