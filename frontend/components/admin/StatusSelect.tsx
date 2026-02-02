'use client'

import { SelectHTMLAttributes, forwardRef, useState, useRef, useEffect } from 'react'

export interface StatusOption {
  value: string
  label: string
  colorClass: string
}

interface StatusSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  hint?: string
  options: StatusOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export const StatusSelect = forwardRef<HTMLDivElement, StatusSelectProps>(
  ({ label, error, hint, options, value, onValueChange, placeholder, className = '', id }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find((opt) => opt.value === value)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }, [])

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {hint && <span className="text-gray-400 font-normal"> {hint}</span>}
          </label>
        )}
        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`input-field appearance-none bg-white cursor-pointer text-left flex items-center justify-between ${
              error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
            } ${className}`}
          >
            {selectedOption ? (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${selectedOption.colorClass}`}>
                {selectedOption.label}
              </span>
            ) : (
              <span className="text-gray-400">{placeholder || 'Select status...'}</span>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onValueChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                    option.value === value ? 'bg-gray-50' : ''
                  }`}
                >
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${option.colorClass}`}>
                    {option.label}
                  </span>
                  {option.value === value && (
                    <svg className="w-4 h-4 text-primary-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1 animate-fade-in">{error}</p>}
      </div>
    )
  }
)

StatusSelect.displayName = 'StatusSelect'

// Pre-defined status options for orders
export const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: 'PENDING', label: 'Pending', colorClass: 'bg-yellow-100 text-yellow-700' },
  { value: 'CONFIRMED', label: 'Confirmed', colorClass: 'bg-blue-100 text-blue-700' },
  { value: 'PREPARING', label: 'Preparing', colorClass: 'bg-purple-100 text-purple-700' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup', colorClass: 'bg-indigo-100 text-indigo-700' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', colorClass: 'bg-cyan-100 text-cyan-700' },
  { value: 'DELIVERED', label: 'Delivered', colorClass: 'bg-green-100 text-green-700' },
  { value: 'CANCELLED', label: 'Cancelled', colorClass: 'bg-red-100 text-red-700' },
]

// Pre-defined status options for payments
export const PAYMENT_STATUS_OPTIONS: StatusOption[] = [
  { value: 'PENDING', label: 'Pending', colorClass: 'bg-yellow-100 text-yellow-700' },
  { value: 'COMPLETED', label: 'Completed', colorClass: 'bg-green-100 text-green-700' },
  { value: 'FAILED', label: 'Failed', colorClass: 'bg-red-100 text-red-700' },
  { value: 'REFUNDED', label: 'Refunded', colorClass: 'bg-blue-100 text-blue-700' },
]
