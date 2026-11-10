import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            clsx(
              'w-full rounded-xl border border-ivory-400 dark:border-espresso-700 bg-white dark:bg-espresso-900 px-3.5 py-2.5 text-sm text-espresso-900 dark:text-ivory-50 placeholder-espresso-300 dark:placeholder-espresso-600 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-200',
              className
            )
          )}
          {...props}
        />
        {helperText && !error && (
          <p className="mt-1 text-xs text-espresso-400 dark:text-ivory-400">{helperText}</p>
        )}
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

