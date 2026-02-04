import en from './en.json'
import ba from './ba.json'


export const LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸', translations: en },
  ba: { name: 'Bosanski', flag: '🇧🇦', translations: ba },
} as const

export type Language = keyof typeof LANGUAGES
export type TranslationKeys = typeof en
export const DEFAULT_LANGUAGE: Language = 'en'
export const AVAILABLE_LANGUAGES = Object.keys(LANGUAGES) as Language[]

// Helper type for nested translation keys
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`
}[keyof ObjectType & (string | number)]

export type TranslationKey = NestedKeyOf<TranslationKeys>
