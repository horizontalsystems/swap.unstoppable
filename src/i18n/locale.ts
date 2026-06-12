'use server'

import { cookies } from 'next/headers'
import { COOKIE_NAME, type Locale } from './config'

// Persists the chosen locale to a cookie. Called from the language switcher;
// writing a cookie inside a Server Action makes the App Router re-render the
// current route, so the new language applies without a full page reload.
export async function setUserLocale(locale: Locale) {
  const store = await cookies()
  store.set(COOKIE_NAME, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })
}