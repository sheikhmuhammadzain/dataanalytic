import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface MenuProps {
  children: React.ReactNode;
  setActive: (item: string | null) => void;
}

export const Menu: React.FC<MenuProps> = ({ children, setActive }) => {
  return (
    <nav className="relative rounded-full border border-gray-200 bg-white shadow-sm flex justify-center space-x-4 px-8 py-4 backdrop-blur-sm">
      {children}
    </nav>
  );
};

interface MenuItemProps {
  setActive: (item: string | null) => void;
  active: string | null;
  item: string;
  children: React.ReactNode;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  setActive,
  active,
  item,
  children,
}) => {
  return (
    <div
      onMouseEnter={() => setActive(item)}
      onMouseLeave={() => setActive(null)}
      className="relative group"
    >
      <button className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
        {item}
      </button>
      {active === item && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-4 text-gray-900 min-w-[200px]"
          >
            {children}
          </motion.div>
        </div>
      )}
    </div>
  );
};

interface HoveredLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
}

export const HoveredLink: React.FC<HoveredLinkProps> = ({ children, ...rest }) => {
  return (
    <a
      {...rest}
      className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
    >
      {children}
    </a>
  );
}; 