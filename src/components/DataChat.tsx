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

// Improved Markdown Formatter
const formatMessageContent = (content: string) => {
  let formattedContent = content;

  // Headers (###)
  formattedContent = formattedContent.replace(
    /###\s*(.*?)(?:\n|$)/g,
    '<h3 class="text-lg font-semibold text-zinc-100 mt-4 mb-2">$1</h3>'
  );

  // Bold (**)
  formattedContent = formattedContent.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-semibold text-zinc-100">$1</strong>'
  );

  // Basic Unordered Lists (- or *) - Simple version
  formattedContent = formattedContent.replace(
    /^\s*[-*]\s+(.*)/gm,
    '<li class="ml-4 list-disc">$1</li>' // Requires parent <ul> or render context
  );
   // Wrap list items potentially
   if (formattedContent.includes('<li')) {
    formattedContent = `<ul class="pl-5">${formattedContent.replace(/<br \/>(<li)/g, '$1')}</ul>`; // Basic list wrapping
   }


  // Newlines
  formattedContent = formattedContent.replace(/\n/g, '<br />');


  return (
    <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
  );
};

// --- Sub-Components ---

// Typing Indicator Component
const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1">
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current delay-0 duration-1000"></span>
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current delay-150 duration-1000"></span>
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current delay-300 duration-1000"></span>
  </div>
);

// Message Item Component
interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "relative flex max-w-[85%] flex-col rounded-xl px-4 py-2.5 shadow-md",
          isUser
            ? "bg-indigo-600 text-white rounded-br-none"
            : isError
              ? "bg-red-500/20 text-red-200 rounded-bl-none"
              : "bg-zinc-700 text-zinc-200 rounded-bl-none"
        )}
      >
        {isError && (
          <div className="flex items-center gap-2 mb-1 text-red-300">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium text-sm">Error</span>
          </div>
        )}
        <div className={cn(
             "prose prose-sm prose-invert max-w-none text-zinc-200",
             "prose-headings:text-zinc-100 prose-strong:text-zinc-100 prose-li:marker:text-zinc-400", // Prose styling overrides
             isUser && "text-white prose-headings:text-white prose-strong:text-white",
             isError && "text-red-200 prose-headings:text-red-100 prose-strong:text-red-100"
             )}>
          {formatMessageContent(message.content)}
          {message.isStreaming && !message.content && <TypingIndicator />}
        </div>
        {message.isStreaming && message.content && (
            <div className="absolute -bottom-2 right-2 text-xs text-zinc-400">
                <TypingIndicator />
            </div>
        )}
      </div>
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
      setMessages([
        {
          id: 'initial-bot-message',
          role: 'assistant',
          content: "Hello! I'm ready to help you analyze your data. Ask me anything about the summary or insights.",
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

    const { summary } = processedData;
    // Be more selective or concise if context gets too large
    const context = `
      Dataset Summary Provided:
      Rows: ${summary.rowCount}, Columns: ${summary.columnCount}
      Numerical Columns: ${summary.numericalColumns.join(', ') || 'None'}
      Categorical Columns: ${summary.categoricalColumns.join(', ') || 'None'}

      Basic Statistics (for some columns):
      ${Object.entries(summary.columnStats)
        .slice(0, 10) // Limit context size if necessary
        .map(([col, stats]) => {
          const statInfo = Object.entries(stats)
            .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`)
            .join(', ');
          return `- ${col}: ${statInfo}`;
        })
        .join('\n')}
      (User is asking questions based on this data summary.)
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
            <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-zinc-700/50 p-3 bg-gradient-to-b from-zinc-800/90 to-zinc-900/70 sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Bot className="h-5 w-5 text-indigo-400" />
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border-2 border-zinc-800"></div>
                </div>
                <h3 className="text-base font-semibold text-zinc-100">Chat with Data</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse Chat" : "Expand Chat"}
                  aria-label={isExpanded ? "Collapse Chat" : "Expand Chat"}
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors rounded-md hover:bg-zinc-700/50"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Chat"
                  aria-label="Close Chat"
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors rounded-md hover:bg-zinc-700/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={chatContainerRef}
              role="log"
              aria-live="polite"
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800/50"
            >
              {messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
               {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                 // Show loader if fetching but haven't added the streaming placeholder yet
                 <div className="flex justify-center py-4">
                   <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                 </div>
               )}
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-zinc-700/50 p-3 bg-zinc-900/90">
              <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your data..."
                  disabled={isLoading}
                  rows={1}
                  maxLength={1000} // Add a max length
                  className={cn(
                    "flex-1 resize-none bg-zinc-700/50 text-zinc-100 placeholder-zinc-400/70 rounded-lg px-3 py-2 pr-10", // Adjusted padding/rounding
                    "border border-transparent focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500", // Focus state
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent" // Scrollbar for textarea
                  )}
                  style={{ maxHeight: '120px' }} // Control max height
                  aria-label="Chat input"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "absolute bottom-1.5 right-1.5 p-1.5 text-zinc-200 rounded-md transition-colors duration-150",
                    "enabled:bg-indigo-600 enabled:hover:bg-indigo-500",
                    "disabled:text-zinc-500 disabled:cursor-not-allowed"
                  )}
                  title="Send Message"
                  aria-label="Send Message"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
              {/* <div className="mt-1.5 text-xs text-zinc-500 text-center px-2">
                Shift+Enter for newline.
              </div> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <AnimatePresence>
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full transition-all duration-200 ease-out",
            "bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700", // Gradient BG
            "text-white shadow-lg hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-zinc-900",
            "md:bottom-6 md:right-6"
          )}
          title="Open Chat"
          aria-label="Open Chat with Data Assistant"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm font-medium hidden md:inline">Chat with Data</span>
        </motion.button>
      )}
      </AnimatePresence>
    </>
  );
};