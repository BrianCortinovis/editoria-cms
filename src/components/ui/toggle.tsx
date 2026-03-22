'use client';

import { useRef } from 'react';
import { useFieldContextStore } from '@/lib/stores/field-context-store';
import { cn } from '@/lib/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, label, size = 'md' }: ToggleProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { captureFieldElement, syncFieldElement } = useFieldContextStore();

  const refreshFieldContext = () => {
    if (!buttonRef.current) {
      return;
    }

    syncFieldElement(buttonRef.current);
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        ref={buttonRef}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        data-field-name={label}
        onFocus={(event) => {
          captureFieldElement(event.currentTarget);
        }}
        onClick={() => {
          onChange(!checked);
          requestAnimationFrame(refreshFieldContext);
        }}
        className={cn(
          'relative inline-flex shrink-0 rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'
        )}
        style={{
          background: checked ? 'var(--c-accent)' : 'var(--c-bg-3)',
        }}
      >
        <span
          className={cn(
            'inline-block rounded-full shadow-sm transform transition-transform duration-200',
            size === 'sm' ? 'h-4 w-4 mt-0.5 ml-0.5' : 'h-5 w-5 mt-0.5 ml-0.5',
            checked && (size === 'sm' ? 'translate-x-4' : 'translate-x-5')
          )}
          style={{ background: 'var(--c-bg-0)' }}
        />
      </button>
      {label && (
        <span className="text-sm" style={{ color: 'var(--c-text-0)' }}>{label}</span>
      )}
    </label>
  );
}
