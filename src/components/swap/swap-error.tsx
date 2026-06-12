'use client'

import { useTranslations } from 'next-intl'
import { Icon } from '@/components/icons'
import { translateError } from '@/lib/errors'

export const SwapError = ({ error }: { error: Error }) => {
  const t = useTranslations('swap.error')
  const result = translateError(error.message || '')
  const text = 'key' in result ? t(result.key) : result.text || t('unknown')

  return (
    <div className="text-lucian flex items-center gap-2 text-sm">
      <Icon name="warning" className="size-4 shrink-0" />
      {text}
    </div>
  )
}
