'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { useFieldContextStore } from '@/lib/stores/field-context-store';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const { setSelectedField, updatePageContext } = useFieldContextStore();

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      const element = e.currentTarget;
      setSelectedField({
        id: element.id || element.name || 'unknown',
        name: element.name || element.id || 'unknown',
        value: element.value || '',
        type: 'select',
        label: label || element.getAttribute('aria-label') || undefined,
        placeholder: undefined,
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
          <label htmlFor={selectId} className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg transition-colors appearance-none',
            'border',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            'bg-[url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%237c8aaa%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8',
            className
          )}
          style={{
            background: `url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%237c8aaa%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e") right 0.5rem center / 1.25rem 1.25rem no-repeat, var(--c-bg-3)`,
            borderColor: 'var(--c-border)',
            color: 'var(--c-text-0)',
            paddingRight: '2rem',
          }}
          onFocus={handleFocus}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);
Select.displayName = 'Select';
