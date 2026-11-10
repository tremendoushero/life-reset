import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'sage' | 'lavender' | 'softblue' | 'peach' | 'pink' | 'orange' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
}) => {
  const variants = {
    sage: 'bg-sage-light dark:bg-sage-dark/30 text-sage-dark dark:text-sage-light border-sage/30',
    lavender: 'bg-lavender-light dark:bg-lavender-dark/30 text-lavender-dark dark:text-lavender-light border-lavender/30',
    softblue: 'bg-softblue-light dark:bg-softblue-dark/30 text-softblue-dark dark:text-softblue-light border-softblue/30',
    peach: 'bg-softpeach-light dark:bg-softpeach-dark/30 text-softpeach-dark dark:text-softpeach-light border-softpeach/30',
    pink: 'bg-softpink-light dark:bg-softpink-dark/30 text-softpink-dark dark:text-softpink-light border-softpink/30',
    orange: 'bg-orange-50 dark:bg-orange-950/40 text-primary border-primary/30',
    neutral: 'bg-ivory-200 dark:bg-espresso-700 text-espresso-600 dark:text-ivory-200 border-ivory-300 dark:border-espresso-600',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 rounded-full font-medium border shrink-0',
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {children}
    </span>
  );
};
