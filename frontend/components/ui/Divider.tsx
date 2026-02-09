'use client'

interface DividerProps {
  text?: string
  className?: string
}

export function Divider({ text, className = '' }: DividerProps) {
  if (!text) {
    return <div className={`w-full border-t border-gray-200 dark:border-neutral-700 ${className}`} />
  }

  return (
    <div className={`relative my-6 ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-neutral-700" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400">{text}</span>
      </div>
    </div>
  )
}
