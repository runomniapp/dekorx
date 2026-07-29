import React from 'react';
import { motion } from 'framer-motion';

export const PillTag = ({
  children,
  active = false,
  onClick,
  icon: Icon,
  className = ''
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`touch-target h-10 px-5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 shrink-0 inline-flex items-center gap-1.5 cursor-pointer shadow-xs ${
        active
          ? 'bg-[#121212] text-white shadow-md'
          : 'bg-[#EAEAEA] text-[#4A4A4A] hover:bg-[#E0E0E0] hover:text-[#121212]'
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </motion.button>
  );
};
