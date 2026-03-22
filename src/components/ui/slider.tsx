'use client';

import { cn } from '@/lib/utils/cn';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  suffix?: string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  suffix = '',
}: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>{label}</span>
          )}
          {showValue && (
            <span className="text-xs font-mono" style={{ color: 'var(--c-text-2)' }}>
              {value}{suffix}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'w-full h-2 rounded-full appearance-none cursor-pointer',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer'
        )}
        style={{
          background: 'var(--c-bg-3)',
          // @ts-expect-error - CSS custom properties in style
          '--slider-thumb-bg': 'var(--c-accent)',
          '--slider-thumb-hover': 'var(--c-accent-hover)',
        } as React.CSSProperties}
      />
    </div>
  );
}
