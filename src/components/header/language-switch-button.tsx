'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Icon } from '@/components/icons'
import { ThemeButton } from '@/components/theme-button'
import { defaultLocale, isLocale, type Locale, localeNames, locales } from '@/i18n/config'
import { setUserLocale } from '@/i18n/locale'
import { cn } from '@/lib/utils'

export const LanguageSwitchButton = () => {
  const t = useTranslations('common')
  const locale = useLocale()
  const current: Locale = isLocale(locale) ? locale : defaultLocale
  const [isPending, startTransition] = useTransition()

  const onSelect = (locale: Locale) => {
    if (locale === current) return
    startTransition(() => {
      setUserLocale(locale)
    })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <ThemeButton variant="secondarySmall" aria-label={t('language')} className="uppercase">
          <span className="sm:hidden">{current}</span>
          <span className="hidden sm:inline">{localeNames[current]}</span>
        </ThemeButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <ScrollArea className="h-80">
          {locales.map(locale => (
            <DropdownMenuItem
              key={locale}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-none px-5 py-3"
              disabled={isPending}
              aria-current={locale === current}
              onSelect={() => onSelect(locale)}
            >
              <span className={cn('text-xs font-semibold', { 'text-brand-first': locale === current })}>{localeNames[locale]}</span>
              {locale === current && <Icon name="check" className="text-brand-first size-4" />}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}