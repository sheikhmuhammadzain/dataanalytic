"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, MessageSquare, X, ChevronDown } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { getChatCompletion } from '../services/groq';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

// Add a helper function to format markdown-style text
const formatMessage = (content: string) => {
  // First replace headers (###)
  let formattedContent = content.replace(
    /###\s*(.*?)(?:\n|$)/g,
    '<h3 class="text-lg font-semibold text-white/90 mt-3 mb-2">$1</h3>'
  );

  // Then replace bold text (**)
  formattedContent = formattedContent.replace(
    /\*\*(.*?)\*\*/g,
    '<span class="font-semibold text-white">$1</span>'
  );

  // Replace newlines with line breaks
  formattedContent = formattedContent.replace(/\n/g, '<br />');
  
  return (
    <span 
      dangerouslySetInnerHTML={{ 
        __html: formattedContent
      }} 
    />
  );
};

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

  // Handle click outside
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getDataContext = () => {
    if (!processedData) return '';
    
    const { summary } = processedData;
    return `
      Dataset Summary:
      - Total rows: ${summary.rowCount}
      - Total columns: ${summary.columnCount}
      - Numerical columns: ${summary.numericalColumns.join(', ')}
      - Categorical columns: ${summary.categoricalColumns.join(', ')}
      
      Column Statistics:
      ${Object.entries(summary.columnStats)
        .map(([col, stats]) => {
          const statInfo = [];
          if (stats.min !== undefined) statInfo.push(`min: ${stats.min}`);
          if (stats.max !== undefined) statInfo.push(`max: ${stats.max}`);
          if (stats.mean !== undefined) statInfo.push(`mean: ${stats.mean.toFixed(2)}`);
          return `${col}: ${statInfo.join(', ')}`;
        })
        .join('\n')}
    `;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !processedData) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

      await getChatCompletion(
        input,
        getDataContext(),
        (chunk) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content += chunk;
            }
            return newMessages;
          });
        }
      );

      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });
    } catch (error) {
      console.error('Failed to get response:', error);
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  if (!processedData) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full md:bottom-8 md:right-8 md:w-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "flex flex-col rounded-none border border-indigo-500/10 bg-black/80 backdrop-blur-xl shadow-2xl md:rounded-2xl",
              isExpanded 
                ? "h-[85vh] max-h-[85vh] md:h-[80vh] md:w-[600px]" 
                : "h-[60vh] max-h-[85vh] md:h-[600px] md:w-[450px]",
              "overflow-hidden" // Prevent content overflow
            )}
            style={{
              maxHeight: 'calc(100vh - 2rem)', // Ensure it doesn't exceed viewport height
              marginBottom: '1rem' // Add some bottom margin
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 p-4 border-b border-indigo-500/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute -top-2 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500">
                    <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  </div>
                  <Bot className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white/90">Chat with your data</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-white/50 hover:text-white/90 transition-colors rounded-lg hover:bg-white/5"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/50 hover:text-white/90 transition-colors rounded-lg hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-indigo-500/10 scrollbar-track-transparent"
            >
              {messages.map((message, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  key={index}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                      message.role === 'user'
                        ? "bg-indigo-500/20 text-white/90"
                        : "bg-white/10 text-white/80"
                    )}
                  >
                    <div className="prose prose-invert max-w-none [&>h3]:mt-4 [&>h3]:mb-2 [&>br]:my-2">
                      {formatMessage(message.content)}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-indigo-500/10 bg-black/50 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="relative flex gap-2">
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about your data..."
                    disabled={isLoading}
                    rows={1}
                    className="w-full resize-none bg-white/5 text-white/90 placeholder-white/30 rounded-xl px-4 py-3 border border-indigo-500/10 focus:outline-none focus:border-indigo-500/30 disabled:opacity-50 pr-12"
                    style={{ maxHeight: '120px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <div className="absolute right-3 bottom-3">
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="p-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-white/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </form>
              <div className="mt-2 text-xs text-white/30 text-center">
                Press Enter to send, Shift + Enter for new line
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-white/90 rounded-full shadow-lg transition-colors backdrop-blur-sm md:bottom-8 md:right-8 group"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium hidden md:inline relative after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/30 after:origin-left after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform">
            Chat with Data
          </span>
        </motion.button>
      )}
    </div>
  );
};