'use client'

import { useLanguage } from '@/hooks/useLanguage'

interface OpeningHoursEntry {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

interface OpeningHoursFormProps {
  value: OpeningHoursEntry[]
  onChange: (hours: OpeningHoursEntry[]) => void
}

const DAY_KEYS = [
  'openingHours.monday',
  'openingHours.tuesday',
  'openingHours.wednesday',
  'openingHours.thursday',
  'openingHours.friday',
  'openingHours.saturday',
  'openingHours.sunday',
]

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '')
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
}

function isValidTime(val: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(val)
}

export function OpeningHoursForm({ value, onChange }: OpeningHoursFormProps) {
  const { t } = useLanguage()

  const updateDay = (dayOfWeek: number, field: keyof OpeningHoursEntry, val: string | boolean) => {
    onChange(
      value.map((entry) =>
        entry.dayOfWeek === dayOfWeek ? { ...entry, [field]: val } : entry
      )
    )
  }

  const handleTimeChange = (dayOfWeek: number, field: 'openTime' | 'closeTime', raw: string) => {
    const formatted = formatTimeInput(raw)
    if (formatted.length <= 5) {
      updateDay(dayOfWeek, field, formatted)
    }
  }

  const handleTimeBlur = (dayOfWeek: number, field: 'openTime' | 'closeTime', val: string) => {
    if (!isValidTime(val)) {
      const entry = value.find((e) => e.dayOfWeek === dayOfWeek)
      if (entry) {
        updateDay(dayOfWeek, field, field === 'openTime' ? '09:00' : '22:00')
      }
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-600 dark:text-neutral-400 font-medium mb-3">{t('openingHours.setOpeningHours')}</p>
      <div className="space-y-2">
        {value.map((entry) => (
          <div
            key={entry.dayOfWeek}
            className="flex items-center gap-3 py-2 px-3 bg-gray-50 dark:bg-neutral-800 rounded-lg"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-neutral-300 w-24 flex-shrink-0">
              {t(DAY_KEYS[entry.dayOfWeek])}
            </span>

            <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={entry.isClosed}
                onChange={(e) => updateDay(entry.dayOfWeek, 'isClosed', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
              />
              <span className="text-xs text-gray-500 dark:text-neutral-400">{t('openingHours.closed')}</span>
            </label>

            <div className="flex items-center gap-2 flex-1 justify-end">
              <input
                type="text"
                inputMode="numeric"
                placeholder="09:00"
                value={entry.openTime}
                onChange={(e) => handleTimeChange(entry.dayOfWeek, 'openTime', e.target.value)}
                onBlur={(e) => handleTimeBlur(entry.dayOfWeek, 'openTime', e.target.value)}
                disabled={entry.isClosed}
                maxLength={5}
                className="px-2 py-1 text-sm text-center border border-gray-200 dark:border-neutral-600 rounded-md disabled:opacity-40 disabled:bg-gray-100 dark:disabled:bg-neutral-700 bg-white dark:bg-neutral-900 dark:text-neutral-100 w-20"
              />
              <span className="text-xs text-gray-400 dark:text-neutral-500">-</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="22:00"
                value={entry.closeTime}
                onChange={(e) => handleTimeChange(entry.dayOfWeek, 'closeTime', e.target.value)}
                onBlur={(e) => handleTimeBlur(entry.dayOfWeek, 'closeTime', e.target.value)}
                disabled={entry.isClosed}
                maxLength={5}
                className="px-2 py-1 text-sm text-center border border-gray-200 dark:border-neutral-600 rounded-md disabled:opacity-40 disabled:bg-gray-100 dark:disabled:bg-neutral-700 bg-white dark:bg-neutral-900 dark:text-neutral-100 w-20"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
