import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  BarChart2, 
  Table2, 
  Download, 
  FileDown, 
  HelpCircle, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Settings,
  Menu as MenuIcon,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  onScrollTo: (id: string) => void;
  onDownloadCSV: () => void;
  onDownloadReport: (format: 'txt' | 'html') => void;
  onShowAdminPanel: () => void;
  isDownloadingReport: boolean;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  isLoading?: boolean;
  badge?: string;
  children?: React.ReactNode;
  isMobile?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  onClick, 
  isLoading = false,
  badge,
  children,
  isMobile = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="w-full">
      <button
        onClick={() => {
          if (children) {
            setIsExpanded(!isExpanded);
          } else {
            onClick?.();
          }
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200 rounded-lg group"
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
        ) : (
          <Icon className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">{label}</span>
        {badge && (
          <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        {children && (
          <ChevronRight 
            className={`w-4 h-4 ml-auto transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-8 py-2 space-y-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarSubItem: React.FC<{ icon: React.ElementType; label: string; onClick: () => void }> = ({
  icon: Icon,
  label,
  onClick
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-2 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 rounded text-sm"
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  onScrollTo,
  onDownloadCSV,
  onDownloadReport,
  onShowAdminPanel,
  isDownloadingReport,
  onCollapseChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notify parent when collapse state changes
  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  // Mobile menu trigger
  const MobileMenuButton = () => (
    <button
      onClick={() => setIsMobileOpen(true)}
      className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
    >
      <MenuIcon className="w-5 h-5 text-gray-600" />
    </button>
  );

  const handleItemClick = (callback: () => void) => {
    callback();
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {(!isCollapsed || isMobile) && (
          <h2 className="font-semibold text-gray-900">Navigation</h2>
        )}
        {isMobile ? (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {isCollapsed && !isMobile ? (
          // Collapsed view - only icons (desktop only)
          <div className="space-y-4">
            <button
              onClick={() => handleItemClick(() => onScrollTo('data-overview'))}
              className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="Data Overview"
            >
              <FileText className="w-5 h-5 text-gray-600 group-hover:text-gray-900 mx-auto" />
            </button>
            <button
              onClick={() => handleItemClick(() => onScrollTo('analytics-dashboard'))}
              className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="Analytics Dashboard"
            >
              <BarChart2 className="w-5 h-5 text-gray-600 group-hover:text-gray-900 mx-auto" />
            </button>
            <button
              onClick={() => handleItemClick(() => onScrollTo('data-preview'))}
              className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="Data Table"
            >
              <Table2 className="w-5 h-5 text-gray-600 group-hover:text-gray-900 mx-auto" />
            </button>
            <button
              onClick={() => handleItemClick(onDownloadCSV)}
              className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="Download CSV"
            >
              <Download className="w-5 h-5 text-gray-600 group-hover:text-gray-900 mx-auto" />
            </button>
            <button
              onClick={() => handleItemClick(onShowAdminPanel)}
              className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="Dashboard Settings"
            >
              <Settings className="w-5 h-5 text-gray-600 group-hover:text-gray-900 mx-auto" />
            </button>
          </div>
        ) : (
          // Expanded view
          <>
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Analysis
              </h3>
              <SidebarItem
                icon={FileText}
                label="Data Overview"
                onClick={() => handleItemClick(() => onScrollTo('data-overview'))}
                isMobile={isMobile}
              />
              <SidebarItem
                icon={BarChart2}
                label="Visualizations"
                onClick={() => handleItemClick(() => onScrollTo('analytics-dashboard'))}
                isMobile={isMobile}
              />
              <SidebarItem
                icon={Table2}
                label="Data Table"
                onClick={() => handleItemClick(() => onScrollTo('data-preview'))}
                isMobile={isMobile}
              />
            </div>

            <div className="space-y-1 pt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Export
              </h3>
              <SidebarItem
                icon={Download}
                label="Download CSV"
                onClick={() => handleItemClick(onDownloadCSV)}
                isMobile={isMobile}
              />
              <SidebarItem
                icon={FileDown}
                label="Reports"
                isMobile={isMobile}
              >
                <SidebarSubItem
                  icon={FileText}
                  label="Text Report"
                  onClick={() => handleItemClick(() => onDownloadReport('txt'))}
                />
                <SidebarSubItem
                  icon={FileDown}
                  label="HTML Report"
                  onClick={() => handleItemClick(() => onDownloadReport('html'))}
                />
              </SidebarItem>
            </div>

            <div className="space-y-1 pt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Tools
              </h3>
              <SidebarItem
                icon={Settings}
                label="Dashboard"
                onClick={() => handleItemClick(onShowAdminPanel)}
                isMobile={isMobile}
              />
              <SidebarItem
                icon={HelpCircle}
                label="Documentation"
                onClick={() => handleItemClick(() => window.open('#', '_blank'))}
                isMobile={isMobile}
              />
              <SidebarItem
                icon={Sparkles}
                label="AI Assistant"
                badge="Beta"
                isMobile={isMobile}
              />
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      {(!isCollapsed || isMobile) && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Data Analytics Dashboard
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <MobileMenuButton />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={isMobile ? { x: -280 } : { x: -240 }}
        animate={{ 
          x: isMobile 
            ? (isMobileOpen ? 0 : -280)
            : 0 
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 h-full bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-lg flex flex-col transition-all duration-300",
          isMobile 
            ? "z-50 w-72" 
            : isCollapsed 
              ? "z-40 w-16" 
              : "z-40 w-64"
        )}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}; 