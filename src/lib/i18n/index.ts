import type { Translations } from './types'
import { de } from './locales/de'
import { en } from './locales/en'

// ─── Locale registry ──────────────────────────────────────────────────────────

export const SUPPORTED_LOCALES = {
  de: { nativeName: 'Deutsch' },
  en: { nativeName: 'English' },
} as const satisfies Record<string, { nativeName: string }>

export type Locale = keyof typeof SUPPORTED_LOCALES

export const DEFAULT_LOCALE: Locale = 'de'

const LOCALE_MAP: Record<Locale, Translations> = { de, en }

// ─── Translation lookup ───────────────────────────────────────────────────────

function lookup(obj: unknown, keys: string[]): string | undefined {
  let node = obj
  for (const key of keys) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[key]
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )
}

/** Build a `t()` function for the given locale, falling back to the default. */
export function buildT(locale: Locale) {
  const translations = LOCALE_MAP[locale]
  const fallback     = LOCALE_MAP[DEFAULT_LOCALE]

  return function t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.')
    const text = lookup(translations, keys) ?? lookup(fallback, keys) ?? key
    return interpolate(text, params)
  }
}

export type { Translations }
