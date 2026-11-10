import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'highlight' | 'warm';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-cardwhite dark:bg-espresso-800 border border-[#EAE3D8] dark:border-espresso-700 shadow-soft-sm',
    subtle: 'bg-ivory-100/60 dark:bg-espresso-900/40 border border-ivory-300 dark:border-espresso-800',
    highlight: 'bg-white dark:bg-espresso-800 border-2 border-primary/40 shadow-soft-md',
    warm: 'bg-softpeach-light/40 dark:bg-espresso-800 border border-softpeach/40 shadow-soft-sm',
  };

  return (
    <div
      className={twMerge(
        clsx('rounded-2xl p-5 transition-all duration-150', variants[variant], className)
      )}
      {...props}
    >
      {children}
    </div>
  );
};
