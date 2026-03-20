'use client';

import { cn } from '@/lib/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, label, size = 'md' }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          checked ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600',
          size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200',
            size === 'sm' ? 'h-4 w-4 mt-0.5 ml-0.5' : 'h-5 w-5 mt-0.5 ml-0.5',
            checked && (size === 'sm' ? 'translate-x-4' : 'translate-x-5')
          )}
        />
      </button>
      {label && (
        <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
      )}
    </label>
  );
}
