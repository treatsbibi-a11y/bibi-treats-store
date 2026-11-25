'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-button transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-4 py-2 h-10 gap-2',
    lg: 'text-base px-6 py-3 h-12 gap-2.5 font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-brand-600 hover:bg-brand-700 text-white shadow-subtle hover:shadow-card',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-900',
    outline:
      'border border-slate-300 hover:border-slate-400 bg-white text-slate-800 shadow-subtle',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-subtle',
    soft:
      'bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 shadow-none',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>กำลังประมวลผล...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
