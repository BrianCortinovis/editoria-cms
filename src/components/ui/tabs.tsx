'use client';

import { forwardRef, useState, createContext, useContext, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface TabsContextType {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs');
  }
  return context;
}

export interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
  defaultValue?: string;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ value, onValueChange, defaultValue, children, className }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue || value || '');

    const activeTab = value !== undefined ? value : internalValue;
    const handleTabChange = (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <TabsContext.Provider value={{ activeTab, onTabChange: handleTabChange }}>
        <div ref={ref} className={className}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-1 p-1 rounded-lg w-full',
        className
      )}
      style={{ background: 'var(--c-bg-2)' }}
      role="tablist"
    >
      {children}
    </div>
  )
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, children, className, disabled }, ref) => {
    const { activeTab, onTabChange } = useTabsContext();
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        disabled={disabled}
        onClick={() => !disabled && onTabChange(value)}
        className={cn(
          'px-3 py-2 text-sm font-medium rounded-md transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        style={isActive ? {
          background: 'var(--c-bg-0)',
          color: 'var(--c-text-0)',
          boxShadow: '0 1px 2px var(--c-accent-soft)',
          focusOutlineOffset: '1px',
        } : {
          color: 'var(--c-text-2)',
        }}
        onMouseEnter={(e) => {
          if (!isActive && !disabled) {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-text-0)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive && !disabled) {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-text-2)';
          }
        }}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, children, className }, ref) => {
    const { activeTab } = useTabsContext();

    if (activeTab !== value) {
      return null;
    }

    return (
      <div ref={ref} role="tabpanel" className={className}>
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';
