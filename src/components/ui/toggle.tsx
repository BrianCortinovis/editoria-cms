'use client';

interface ToggleProps {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Toggle({ pressed, onPressedChange, children, className, title }: ToggleProps) {
  return (
    <button
      onClick={() => onPressedChange?.(!pressed)}
      className={`p-1.5 rounded transition ${pressed ? 'bg-zinc-200 dark:bg-zinc-700' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'} ${className || ''}`}
      title={title}
      data-state={pressed ? 'on' : 'off'}
    >
      {children}
    </button>
  );
}
