'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', style, ...props }, ref) => {
    const getVariantStyles = (): React.CSSProperties => {
      switch (variant) {
        case 'primary':
          return {
            background: 'var(--c-accent)',
            color: 'white',
          };
        case 'secondary':
          return {
            background: 'var(--c-bg-2)',
            color: 'var(--c-text-0)',
          };
        case 'ghost':
          return {
            background: 'transparent',
            color: 'var(--c-text-0)',
          };
        case 'danger':
          return {
            background: 'var(--c-danger)',
            color: 'white',
          };
        case 'outline':
          return {
            background: 'transparent',
            color: 'var(--c-text-0)',
            border: '1px solid var(--c-border)',
          };
        default:
          return {};
      }
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'text-xs px-2 py-1 gap-1': size === 'xs',
            'text-sm px-3 py-1.5 gap-1.5': size === 'sm',
            'text-sm px-4 py-2 gap-2': size === 'md',
            'text-base px-5 py-2.5 gap-2': size === 'lg',
          },
          className
        )}
        style={{ ...getVariantStyles(), ...style }}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
