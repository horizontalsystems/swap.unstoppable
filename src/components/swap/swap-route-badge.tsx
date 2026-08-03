import { useTranslations } from 'next-intl'

interface SwapRouteBadgeProps {
  index: number
  fasterIndex: number
}

export const SwapRouteBadge = ({ index, fasterIndex }: SwapRouteBadgeProps) => {
  const t = useTranslations('swap.route')

  if (index === 0) {
    return <span className="text-remus text-xs font-semibold">{t('bestPrice')}</span>
  }
  if (index === fasterIndex) {
    return <span className="text-jacob text-xs font-semibold">{t('faster')}</span>
  }
  return null
}
