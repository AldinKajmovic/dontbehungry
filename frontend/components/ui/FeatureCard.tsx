'use client'

import { ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  iconColor?: 'primary' | 'secondary' | 'blue' | 'green' | 'red' | 'yellow'
  title: string
  description: string
  className?: string
}

const bgColors = {
  primary: 'bg-primary-100 dark:bg-primary-950/50',
  secondary: 'bg-secondary-100 dark:bg-secondary-900/30',
  blue: 'bg-blue-100 dark:bg-blue-950/50',
  green: 'bg-green-100 dark:bg-green-950/50',
  red: 'bg-red-100 dark:bg-red-950/50',
  yellow: 'bg-yellow-100 dark:bg-yellow-950/50',
}

const textColors = {
  primary: 'text-primary-600 dark:text-primary-400',
  secondary: 'text-secondary-600 dark:text-secondary-400',
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  red: 'text-red-600 dark:text-red-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
}

export function FeatureCard({
  icon,
  iconColor = 'primary',
  title,
  description,
  className = '',
}: FeatureCardProps) {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 ${className}`}>
      <div className={`w-14 h-14 ${bgColors[iconColor]} rounded-2xl flex items-center justify-center mb-6`}>
        <div className={`w-7 h-7 ${textColors[iconColor]}`}>{icon}</div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-neutral-400">{description}</p>
    </div>
  )
}
