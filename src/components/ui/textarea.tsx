'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { useFieldContextStore } from '@/lib/stores/field-context-store';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const { setSelectedField, updatePageContext } = useFieldContextStore();

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const element = e.currentTarget;
      setSelectedField({
        id: element.id || element.name || 'unknown',
        name: element.name || element.id || 'unknown',
        value: element.value || '',
        type: 'textarea',
        label: label || element.getAttribute('aria-label') || undefined,
        placeholder: element.getAttribute('placeholder') || undefined,
      });

      // Collect page context
      const form = element.closest('form') || element.closest('[data-form]') || document;
      const allFields: Record<string, string> = {};
      const inputs = form.querySelectorAll('input[name], textarea[name], select[name]');
      inputs.forEach((input: any) => {
        if (input.name && input.value) {
          allFields[input.name] = input.value;
        }
      });

      updatePageContext({
        allFields,
        pageName: document.title,
      });

      props.onFocus?.(e);
    };

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg transition-colors',
            'border',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            'resize-vertical',
            className
          )}
          style={{
            background: 'var(--c-bg-3)',
            borderColor: error ? 'var(--c-danger)' : 'var(--c-border)',
            color: 'var(--c-text-0)',
          }}
          onFocus={handleFocus}
          {...props}
        />
        {error && <span className="text-xs" style={{ color: 'var(--c-danger)' }}>{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
