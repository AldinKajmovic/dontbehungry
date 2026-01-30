'use client'

import { ReactNode } from 'react'

interface SectionProps {
  title: string
  description?: string
  children: ReactNode
  headerAction?: ReactNode
  variant?: 'default' | 'danger'
  className?: string
}

export function Section({
  title,
  description,
  children,
  headerAction,
  variant = 'default',
  className = '',
}: SectionProps) {
  const borderClass = variant === 'danger' ? 'border border-red-200' : ''
  const titleClass = variant === 'danger' ? 'text-red-600' : 'text-gray-900'

  return (
    <section className={`bg-white rounded-xl shadow-sm p-6 ${borderClass} ${className}`}>
      <div className={`flex items-center justify-between ${description ? 'mb-4' : 'mb-4'}`}>
        <div>
          <h2 className={`text-lg font-semibold ${titleClass}`}>{title}</h2>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
        {headerAction && (
          <div>{headerAction}</div>
        )}
      </div>
      {children}
    </section>
  )
}
