import React from 'react';
import { motion } from 'framer-motion';

export const FloatingCard = ({
  children,
  className = '',
  hoverEffect = true,
  onClick,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
      className={`glass-floating-card p-5 transition-all duration-300 ${
        hoverEffect ? 'hover:shadow-xl hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
