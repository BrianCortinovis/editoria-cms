import { forwardRef, type ButtonHTMLAttributes } from 'react';
import cn from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded font-medium transition-colors',
          variant === 'default' && 'bg-zinc-800 text-white hover:bg-zinc-700',
          variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
          variant === 'ghost' && 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
          variant === 'outline' && 'border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800',
          size === 'xs' && 'h-6 px-2 text-[10px]',
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'md' && 'h-9 px-4 text-sm',
          size === 'lg' && 'h-10 px-6 text-base',
          size === 'icon' && 'h-8 w-8',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
