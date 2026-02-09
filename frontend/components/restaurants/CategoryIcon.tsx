'use client'

import { Category } from '@/services/public'

interface CategoryIconProps {
  category: Category
  isSelected: boolean
  onClick: (categoryId: string | null) => void
}

// Default icons for common food categories
const getCategoryIcon = (name: string): string => {
  const lowerName = name.toLowerCase()

  // Map common category names to emoji icons
  // It will be pictures soon
  const iconMap: Record<string, string> = {
    pizza: '🍕',
    burger: '🍔',
    burgers: '🍔',
    chicken: '🍗',
    halal: '🥙',
    grill: '🥩',
    pasta: '🍝',
    sandwich: '🥪',
    'fast food': '🍟',
    doner: '🥙',
    cake: '🎂',
    dessert: '🍰',
    kebab: '🥙',
    italian: '🇮🇹',
    pancake: '🥞',
    traditional: '🍲',
    salad: '🥗',
    snacks: '🍿',
    sweets: '🍬',
    sushi: '🍣',
    asian: '🥢',
    mexican: '🌮',
    indian: '🍛',
    seafood: '🦐',
    vegetarian: '🥬',
    vegan: '🌱',
    breakfast: '🍳',
    coffee: '☕',
    drinks: '🥤',
    promo: '🏷️',
  }

  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return icon
    }
  }

  return '🍽️'
}

export function CategoryIcon({ category, isSelected, onClick }: CategoryIconProps) {
  const icon = category.iconUrl || getCategoryIcon(category.name)

  return (
    <button
      onClick={() => onClick(isSelected ? null : category.id)}
      className={`
        flex flex-col items-center gap-2 min-w-[70px] p-2 rounded-xl
        transition-all duration-300 transform
        hover:scale-110
        ${isSelected
          ? 'bg-primary-50 dark:bg-primary-950/30 ring-2 ring-primary-500'
          : 'hover:bg-gray-50 dark:hover:bg-neutral-800'
        }
      `}
    >
      <div
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-300 transform
          hover:scale-110
          ${isSelected
            ? 'bg-primary-100 dark:bg-primary-950/50 shadow-lg'
            : 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700'
          }
        `}
      >
        {category.iconUrl ? (
          <img
            src={category.iconUrl}
            alt={category.name}
            className="w-10 h-10 object-contain"
          />
        ) : (
          <span className="text-2xl">{icon}</span>
        )}
      </div>
      <span
        className={`
          text-xs text-center font-medium truncate max-w-full [text-shadow:_0_1px_2px_rgba(0,0,0,0.1)]
          ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-neutral-200'}
        `}
      >
        {category.name}
      </span>
    </button>
  )
}
