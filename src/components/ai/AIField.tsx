"use client";

import AIFieldHelper from "./AIFieldHelper";

interface AIFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url" | "tel" | "number" | "date" | "datetime-local";
  multiline?: boolean;
  rows?: number;
  context?: Record<string, any>;
  disabled?: boolean;
  className?: string;
  /** If false, hides the AI button */
  showAI?: boolean;
}

export default function AIField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
  rows = 2,
  context,
  disabled = false,
  className = "",
  showAI = true,
}: AIFieldProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
          {label}
        </label>
        {showAI && (
          <AIFieldHelper
            fieldName={label}
            fieldValue={value}
            context={context}
            onGenerate={onChange}
            compact={true}
          />
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="input w-full resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="input w-full"
        />
      )}
    </div>
  );
}
