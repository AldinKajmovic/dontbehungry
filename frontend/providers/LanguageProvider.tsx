'use client'

import { createContext, useCallback, useEffect, useState, ReactNode } from 'react'
import {
  LANGUAGES,
  Language,
  TranslationKeys,
  DEFAULT_LANGUAGE,
  AVAILABLE_LANGUAGES,
} from '@/locales'

const STORAGE_KEY = 'preferred-language'

// Get nested value from object using dot notation
function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path // Return path as fallback if key not found
    }
  }

  return typeof current === 'string' ? current : path
}

// Interpolate variables in translation string
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template

  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`
  })
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  availableLanguages: readonly Language[]
  languageInfo: typeof LANGUAGES
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && AVAILABLE_LANGUAGES.includes(stored as Language)) {
      setLanguageState(stored as Language)
    }
    setIsHydrated(true)
  }, [])

  // Update document lang attribute when language changes
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.lang = language
    }
  }, [language, isHydrated])

  const setLanguage = useCallback((lang: Language) => {
    if (AVAILABLE_LANGUAGES.includes(lang)) {
      setLanguageState(lang)
      localStorage.setItem(STORAGE_KEY, lang)
    }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const translations = LANGUAGES[language].translations as TranslationKeys
      const value = getNestedValue(translations, key)
      return interpolate(value, params)
    },
    [language]
  )

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    availableLanguages: AVAILABLE_LANGUAGES,
    languageInfo: LANGUAGES,
  }

  // Prevent hydration mismatch by rendering children only after hydration
  // This ensures server and client render the same content initially
  if (!isHydrated) {
    return (
      <LanguageContext.Provider value={value}>
        {children}
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
