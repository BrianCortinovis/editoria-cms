'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg transition-colors',
            'border',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            className
          )}
          style={{
            background: 'var(--c-bg-3)',
            borderColor: error ? 'var(--c-danger)' : 'var(--c-border)',
            color: 'var(--c-text-0)',
            focusRingColor: error ? 'var(--c-danger)' : 'var(--c-accent)',
          }}
          {...props}
        />
        {error && <span className="text-xs" style={{ color: 'var(--c-danger)' }}>{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
