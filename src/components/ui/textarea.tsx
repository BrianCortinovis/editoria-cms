'use client';

import { forwardRef, useEffect, useId, useRef, useState, type TextareaHTMLAttributes } from 'react';
import { useFieldContextStore } from '@/lib/stores/field-context-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, value, onChange, onBlur, onInput, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || `textarea-${generatedId}`;
    const { setSelectedField, updatePageContext } = useFieldContextStore();
    const { setIsEditingProps } = useUiStore();
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const [draftValue, setDraftValue] = useState(String(value ?? ''));
    const focusedRef = useRef(false);

    useEffect(() => {
      // Always sync draftValue with the prop value
      // The textarea's onChange will handle user edits
      setDraftValue(String(value ?? ''));
    }, [value]);

    useEffect(() => {
      const element = innerRef.current;
      if (!element) {
        return;
      }

      const handleNativeInput = () => {
        setDraftValue(element.value);
      };

      element.addEventListener('input', handleNativeInput);
      return () => {
        element.removeEventListener('input', handleNativeInput);
      };
    }, []);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const element = e.currentTarget;
      focusedRef.current = true;
      setIsEditingProps(true);
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
      const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input[name], textarea[name], select[name]');
      inputs.forEach((input) => {
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

    const syncValue = (target: HTMLTextAreaElement) => {
      setDraftValue(target.value);
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      syncValue(e.currentTarget);
      onInput?.(e as React.FormEvent<HTMLTextAreaElement> & React.InputEvent<HTMLTextAreaElement>);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      syncValue(e.currentTarget);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      focusedRef.current = false;
      setIsEditingProps(false);
      onBlur?.(e);
    };

    const stopEventPropagation = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
      event.stopPropagation();
    };

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
            {label}
          </label>
        )}
        <textarea
          data-editor-input="true"
          data-ai-ignore-field-context="true"
          ref={(node) => {
            innerRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
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
          onFocusCapture={() => {
            focusedRef.current = true;
          }}
          onInput={handleInput}
          onChange={handleChange}
          onBlur={handleBlur}
          onMouseDown={stopEventPropagation}
          onPointerDown={stopEventPropagation}
          onClick={stopEventPropagation}
          value={draftValue}
          {...props}
        />
        {error && <span className="text-xs" style={{ color: 'var(--c-danger)' }}>{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
