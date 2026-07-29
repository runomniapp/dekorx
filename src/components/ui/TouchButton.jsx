import React from 'react';
import { motion } from 'framer-motion';

export const TouchButton = ({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'yellow' | 'outline' | 'dark' | 'glass'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  className = '',
  disabled = false,
  fullWidth = false,
  ...props
}) => {
  const baseStyles = 'touch-target inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95';

  const variantStyles = {
    yellow: 'bg-[#FAD02C] text-[#121212] font-semibold hover:bg-[#ebd520] shadow-sm',
    primary: 'bg-[#121212] text-white hover:bg-black shadow-md',
    secondary: 'bg-[#EAEAEA] text-[#121212] hover:bg-[#dfdfdf]',
    outline: 'border-2 border-[#121212] text-[#121212] hover:bg-[#121212] hover:text-white',
    dark: 'bg-[#1E1E1E] text-white hover:bg-[#2A2A2A]',
    glass: 'bg-white/80 backdrop-blur-md text-[#121212] border border-white/60 shadow-sm hover:bg-white'
  };

  const sizeStyles = {
    sm: 'h-10 px-4 text-xs font-medium gap-1.5',
    md: 'h-12 px-6 text-sm font-semibold gap-2',
    lg: 'h-14 px-8 text-base font-bold gap-2.5'
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.94 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </motion.button>
  );
};
