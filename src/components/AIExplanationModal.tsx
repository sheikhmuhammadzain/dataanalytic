import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export const AIExplanationModal: React.FC<AIExplanationModalProps> = ({
  isOpen,
  onClose,
  content,
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setDisplayedContent('');
      setCurrentIndex(0);
      return;
    }

    // Reset for new content
    if (currentIndex === 0) {
      setDisplayedContent('');
    }

    // Faster typewriter effect
    const timer = setInterval(() => {
      if (currentIndex < content.length) {
        // Process multiple characters at once for faster typing
        const chunkSize = 3;
        const nextChunk = content.slice(currentIndex, currentIndex + chunkSize);
        setDisplayedContent(prev => prev + nextChunk);
        setCurrentIndex(prev => Math.min(prev + chunkSize, content.length));
      } else {
        clearInterval(timer);
      }
    }, 15); // Faster interval

    return () => clearInterval(timer);
  }, [isOpen, content, currentIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-black/80 backdrop-blur-xl rounded-2xl border border-indigo-500/20 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-indigo-500/10">
          <h3 className="text-xl font-semibold text-white">AI Analysis</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-white/90 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-white border-b border-indigo-500/20 pb-2 mb-4">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-white border-b border-indigo-500/10 pb-2 mb-3">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-white mb-2">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-white text-base leading-relaxed mb-4">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 mb-4 text-white">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-4 text-white">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-white">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white bg-indigo-500/10 px-1 rounded">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-white">{children}</em>
                ),
                code: ({ children }) => (
                  <code className="bg-indigo-500/10 rounded px-2 py-0.5 text-sm font-mono text-white">{children}</code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-indigo-500/50 pl-4 py-1 italic text-white mb-4 bg-indigo-500/5">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {displayedContent}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-indigo-500/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 