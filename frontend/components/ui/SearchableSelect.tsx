'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  label?: string
  hint?: string
  error?: string
  value: string
  onChange: (value: string, label?: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  emptyMessage?: string
  loadOptions: (search: string) => Promise<SelectOption[]>
  id?: string
  initialLabel?: string
}

export function SearchableSelect({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder = 'Search...',
  required,
  disabled,
  emptyMessage = 'No results found',
  loadOptions,
  id,
  initialLabel,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(initialLabel || '')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchOptions = useCallback(async (searchTerm: string) => {
    try {
      setLoading(true)
      const results = await loadOptions(searchTerm)
      setOptions(results)

      // Update selected label if value is set
      if (value && !selectedLabel) {
        const selected = results.find((opt) => opt.value === value)
        if (selected) setSelectedLabel(selected.label)
      }
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [loadOptions, value, selectedLabel])

  // Update selectedLabel when initialLabel changes
  useEffect(() => {
    if (initialLabel) {
      setSelectedLabel(initialLabel)
    }
  }, [initialLabel])

  // Initial load
  useEffect(() => {
    fetchOptions('')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (isOpen) {
        fetchOptions(search)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [search, isOpen, fetchOptions])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option: SelectOption) => {
    onChange(option.value, option.label)
    setSelectedLabel(option.label)
    setIsOpen(false)
    setSearch('')
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    fetchOptions(search)
  }

  const handleClear = () => {
    onChange('')
    setSelectedLabel('')
    setSearch('')
    inputRef.current?.focus()
  }

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {hint && <span className="text-gray-400 dark:text-neutral-500 font-normal"> {hint}</span>}
        </label>
      )}

      <div className="relative">
        <div className={`input-field flex items-center gap-2 cursor-pointer ${error ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20' : ''} ${disabled ? 'bg-gray-100 dark:bg-neutral-800 cursor-not-allowed' : ''}`}>
          <input
            ref={inputRef}
            id={id}
            type="text"
            className="flex-1 min-w-0 bg-transparent outline-none text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 truncate"
            placeholder={selectedLabel || placeholder}
            value={isOpen ? search : selectedLabel}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={handleInputFocus}
            disabled={disabled}
            autoComplete="off"
          />

          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full"
            >
              <svg className="w-4 h-4 text-gray-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <svg
            className={`w-5 h-5 text-gray-400 dark:text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-sm text-gray-500 dark:text-neutral-400">Loading...</span>
              </div>
            ) : options.length === 0 ? (
              <div className="py-4 px-3 text-center text-gray-500 dark:text-neutral-400 text-sm">
                {emptyMessage}
              </div>
            ) : (
              <ul className="py-1">
                {options.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => handleSelect(option)}
                    className={`px-3 py-2 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors ${
                      option.value === value ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400' : 'text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1 animate-fade-in">{error}</p>}
    </div>
  )
}
