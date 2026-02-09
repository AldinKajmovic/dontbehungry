'use client'

import { useState, useEffect } from 'react'

interface RangeFilterProps {
  label: string
  minValue: string
  maxValue: string
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
}

export function RangeFilter({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  min = 0,
  max = 100,
  step = 1,
  prefix = '',
}: RangeFilterProps) {
  const [localMin, setLocalMin] = useState(minValue)
  const [localMax, setLocalMax] = useState(maxValue)

  useEffect(() => {
    setLocalMin(minValue)
    setLocalMax(maxValue)
  }, [minValue, maxValue])

  const handleMinBlur = () => {
    onMinChange(localMin)
  }

  const handleMaxBlur = () => {
    onMaxChange(localMax)
  }

  const inputClasses = `w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500`

  return (
    <div className="min-w-[200px]">
      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 text-sm">
              {prefix}
            </span>
          )}
          <input
            type="number"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            onBlur={handleMinBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleMinBlur()}
            placeholder="Min"
            min={min}
            max={max}
            step={step}
            className={`${inputClasses} ${prefix ? 'pl-6' : ''}`}
          />
        </div>
        <span className="text-gray-400 dark:text-neutral-500">-</span>
        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 text-sm">
              {prefix}
            </span>
          )}
          <input
            type="number"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            onBlur={handleMaxBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleMaxBlur()}
            placeholder="Max"
            min={min}
            max={max}
            step={step}
            className={`${inputClasses} ${prefix ? 'pl-6' : ''}`}
          />
        </div>
      </div>
    </div>
  )
}
