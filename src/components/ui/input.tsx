'use client';

import { forwardRef, useEffect, useId, useRef, useState, type InputHTMLAttributes } from 'react';
import { useFieldContextStore } from '@/lib/stores/field-context-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

type InputFieldContextType =
  | 'text'
  | 'email'
  | 'number'
  | 'url'
  | 'password'
  | 'date'
  | 'datetime-local'
  | 'tel'
  | 'checkbox'
  | 'radio';

function normalizeInputFieldType(rawType: string | null): InputFieldContextType {
  const type = (rawType || 'text').toLowerCase();
  const supported: InputFieldContextType[] = [
    'text',
    'email',
    'number',
    'url',
    'password',
    'date',
    'datetime-local',
    'tel',
    'checkbox',
    'radio',
  ];

  return supported.includes(type as InputFieldContextType)
    ? (type as InputFieldContextType)
    : 'text';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, value, onChange, onBlur, onInput, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const { setSelectedField, updatePageContext } = useFieldContextStore();
    const { setIsEditingProps } = useUiStore();
    const innerRef = useRef<HTMLInputElement | null>(null);
    const [draftValue, setDraftValue] = useState<string | number>((value ?? '') as string | number);
    const focusedRef = useRef(false);

    useEffect(() => {
      // Always sync draftValue with the prop value
      // The input's onChange will handle user edits
      setDraftValue((value ?? '') as string | number);
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

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const element = e.currentTarget;
      focusedRef.current = true;
      setIsEditingProps(true);
      setSelectedField({
        id: element.id || element.name || 'unknown',
        name: element.name || element.id || 'unknown',
        value: element.value || '',
        type: normalizeInputFieldType(element.getAttribute('type')),
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

    const syncValue = (target: HTMLInputElement) => {
      setDraftValue(target.value);
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      syncValue(e.currentTarget);
      (onInput as any)?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      syncValue(e.currentTarget);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      focusedRef.current = false;
      setIsEditingProps(false);
      onBlur?.(e);
    };

    const stopEventPropagation = (event: React.SyntheticEvent<HTMLInputElement>) => {
      event.stopPropagation();
    };

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
            {label}
          </label>
        )}
        <input
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
Input.displayName = 'Input';
