'use client'

interface DividerProps {
  text?: string
  className?: string
}

export function Divider({ text, className = '' }: DividerProps) {
  if (!text) {
    return <div className={`w-full border-t border-gray-200 ${className}`} />
  }

  return (
    <div className={`relative my-6 ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-gray-500">{text}</span>
      </div>
    </div>
  )
}
