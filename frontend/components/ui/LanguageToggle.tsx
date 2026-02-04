'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { Language } from '@/locales'

interface LanguageToggleProps {
  className?: string
}

export function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { language, setLanguage, availableLanguages, languageInfo } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
    setIsOpen(false)
  }

  const currentLanguage = languageInfo[language]

  return (
    <div ref={dropdownRef} className={`relative z-50 ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{language.toUpperCase()}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[100]"
          role="listbox"
          aria-label="Available languages"
        >
          {availableLanguages.map((lang) => {
            const info = languageInfo[lang]
            const isSelected = lang === language

            return (
              <button
                key={lang}
                onClick={(e) => {
                  e.stopPropagation()
                  handleLanguageSelect(lang)
                }}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                  transition-colors cursor-pointer
                  ${isSelected
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
                role="option"
                aria-selected={isSelected}
              >
                <span className="text-base">{info.flag}</span>
                <span>{info.name}</span>
                {isSelected && (
                  <svg
                    className="w-4 h-4 ml-auto text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
