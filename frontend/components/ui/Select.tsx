'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  labelClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className = '', labelClassName, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className={`block text-sm font-medium mb-2 ${labelClassName || 'text-gray-700 dark:text-neutral-300'}`}>
            {label}
            {hint && <span className="text-gray-400 dark:text-neutral-500 font-normal"> {hint}</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`input-field appearance-none cursor-pointer ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500 mt-1 animate-fade-in">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
