import { AppConfig } from '@/config'

// i18n configuration — cookie-based locale (no locale in the URL)
export const locales = [
  'en',
  'zh',
  'es',
  'hi',
  'ar',
  'pt',
  'fr',
  'ru',
  'de',
  'ja',
  'bn',
  'id',
  'ur',
  'tr',
  'ko',
  'it',
  'vi',
  'fa',
  'th',
  'zh-Hant',
  'arz',
  'pcm',
  'lah'
] as const

export type Locale = (typeof locales)[number]

export const isLocale = (value: unknown): value is Locale => locales.includes(value as Locale)

export const defaultLocale: Locale = isLocale(AppConfig.defaultLocale) ? AppConfig.defaultLocale : 'en'
export const baseLocale: Locale = 'en'

export const COOKIE_NAME = 'NEXT_LOCALE'

// Native language names shown in the language switcher.
export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '简体中文',
  'zh-Hant': '繁體中文',
  ko: '한국어',
  ru: 'Русский',
  es: 'Español',
  fa: 'فارسی',
  tr: 'Türkçe',
  hi: 'हिन्दी',
  ar: 'العربية',
  fr: 'Français',
  bn: 'বাংলা',
  pt: 'Português',
  ja: '日本語',
  lah: 'لہندا',
  ur: 'اردو',
  id: 'Bahasa Indonesia',
  de: 'Deutsch',
  it: 'Italiano',
  pcm: 'Naijá',
  arz: 'العربية المصرية',
  vi: 'Tiếng Việt',
  th: 'ไทย'
}

export const localeFlags: Record<Locale, string> = {
  en: '/flags/us.svg',
  zh: '/flags/cn.svg',
  'zh-Hant': '/flags/tw.svg',
  ko: '/flags/kr.svg',
  ru: '/flags/ru.svg',
  es: '/flags/es.svg',
  fa: '/flags/ir.svg',
  tr: '/flags/tr.svg',
  hi: '/flags/in.svg',
  ar: '/flags/sa.svg',
  fr: '/flags/fr.svg',
  bn: '/flags/bd.svg',
  pt: '/flags/pt.svg',
  ja: '/flags/jp.svg',
  lah: '/flags/pk.svg',
  ur: '/flags/pk.svg',
  id: '/flags/id.svg',
  de: '/flags/de.svg',
  it: '/flags/it.svg',
  pcm: '/flags/ng.svg',
  arz: '/flags/eg.svg',
  vi: '/flags/vn.svg',
  th: '/flags/th.svg'
}

// Right-to-left locales need dir="rtl" on the <html> element.
const rtlLocales: Locale[] = ['fa', 'ar', 'arz', 'ur', 'lah']

export const getLangDir = (locale: Locale): 'rtl' | 'ltr' => (rtlLocales.includes(locale) ? 'rtl' : 'ltr')
