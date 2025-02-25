import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface MenuProps {
  children: React.ReactNode;
  setActive: (item: string | null) => void;
}

export const Menu: React.FC<MenuProps> = ({ children, setActive }) => {
  return (
    <nav className="relative rounded-full border border-transparent dark:border-white/[0.2] bg-black shadow-input flex justify-center space-x-4 px-8 py-4 backdrop-blur-sm">
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
      <button className="text-white/70 hover:text-white transition-colors">
        {item}
      </button>
      {active === item && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-black/80 backdrop-blur-sm border border-white/[0.2] rounded-2xl shadow-xl p-4 text-white min-w-[200px]"
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
      className="text-white/70 hover:text-white transition-colors cursor-pointer"
    >
      {children}
    </a>
  );
}; 