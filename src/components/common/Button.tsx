import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gentle';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  icon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-primary text-white hover:opacity-95 shadow-soft-sm hover:shadow-soft-md',
    secondary: 'bg-espresso-800 text-ivory-50 hover:bg-espresso-900 shadow-soft-sm',
    outline: 'border border-espresso-200 dark:border-espresso-700 bg-transparent hover:bg-ivory-200/50 dark:hover:bg-espresso-800 text-espresso-800 dark:text-ivory-100',
    ghost: 'bg-transparent hover:bg-ivory-300/40 dark:hover:bg-espresso-800 text-espresso-700 dark:text-ivory-200',
    danger: 'bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 border border-red-200 dark:border-red-900/40',
    gentle: 'bg-sage-light dark:bg-sage-dark/30 text-sage-dark dark:text-sage-light hover:bg-sage/20 border border-sage/30',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

