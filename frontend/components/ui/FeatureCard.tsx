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
  primary: 'bg-primary-100',
  secondary: 'bg-secondary-100',
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  red: 'bg-red-100',
  yellow: 'bg-yellow-100',
}

const textColors = {
  primary: 'text-primary-600',
  secondary: 'text-secondary-600',
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
}

export function FeatureCard({
  icon,
  iconColor = 'primary',
  title,
  description,
  className = '',
}: FeatureCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow ${className}`}>
      <div className={`w-14 h-14 ${bgColors[iconColor]} rounded-2xl flex items-center justify-center mb-6`}>
        <div className={`w-7 h-7 ${textColors[iconColor]}`}>{icon}</div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
