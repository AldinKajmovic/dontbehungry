'use client'

import { Select } from '@/components/ui'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
  placeholder?: string
}

interface FilterBarProps {
  filters: FilterConfig[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onClear: () => void
}

export function FilterBar({ filters, values, onChange, onClear }: FilterBarProps) {
  const hasActiveFilters = Object.values(values).some((v) => v !== '')

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl mb-4">
      {filters.map((filter) => (
        <div key={filter.key} className="min-w-[160px]">
          <Select
            label={filter.label}
            id={`filter-${filter.key}`}
            value={values[filter.key] || ''}
            onChange={(e) => onChange(filter.key, e.target.value)}
            options={[{ value: '', label: filter.placeholder || 'All' }, ...filter.options]}
            labelClassName="text-gray-700 dark:text-neutral-200"
          />
        </div>
      ))}

      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear filters
        </button>
      )}
    </div>
  )
}
