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

  const stopEventPropagation = (event: React.SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <label
      className="flex items-center gap-2 cursor-pointer select-none"
      onMouseDown={stopEventPropagation}
      onPointerDown={stopEventPropagation}
      onClick={stopEventPropagation}
    >
      <button
        ref={buttonRef}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        data-editor-input="true"
        data-ai-ignore-field-context="true"
        data-field-name={label}
        onFocus={(event) => {
          captureFieldElement(event.currentTarget);
        }}
        onClick={() => {
          onChange(!checked);
          requestAnimationFrame(refreshFieldContext);
        }}
        onMouseDown={stopEventPropagation}
        onPointerDown={stopEventPropagation}
        onKeyDown={stopEventPropagation}
        onKeyUp={stopEventPropagation}
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
        <span
          className="text-sm"
          style={{ color: 'var(--c-text-0)' }}
          onMouseDown={stopEventPropagation}
          onPointerDown={stopEventPropagation}
        >
          {label}
        </span>
      )}
    </label>
  );
}
