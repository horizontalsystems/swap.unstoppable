import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, defaultLocale, isLocale } from './config'
import en from './messages/en.json'

type Messages = Record<string, unknown>

// Deep-merges a locale's messages over the English base so any key missing from
// a translation transparently falls back to English instead of breaking the UI.
function withFallback(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base }
  for (const key of Object.keys(override)) {
    const o = override[key]
    const b = base[key]
    out[key] =
      o && typeof o === 'object' && !Array.isArray(o) && b && typeof b === 'object' && !Array.isArray(b)
        ? withFallback(b as Messages, o as Messages)
        : o
  }
  return out
}

// Resolves the active locale from the cookie on every request and loads the
// matching message dictionary. Picked up automatically by the next-intl plugin
// (see next.config.ts). No locale ever appears in the URL.
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(COOKIE_NAME)?.value
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale

  const messages =
    locale === defaultLocale ? en : withFallback(en as Messages, (await import(`./messages/${locale}.json`)).default)

  return { locale, messages: messages as Messages }
})