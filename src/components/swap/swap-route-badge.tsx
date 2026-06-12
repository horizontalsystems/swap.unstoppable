import { useTranslations } from 'next-intl'

interface SwapRouteBadgeProps {
  index: number
  fasterIndex: number
}

export const SwapRouteBadge = ({ index, fasterIndex }: SwapRouteBadgeProps) => {
  const t = useTranslations('swap.route')

  if (index === 0) {
    return <span className="text-remus border-remus rounded-lg border px-1.5 text-[10px] font-semibold">{t('bestPrice')}</span>
  }
  if (index === fasterIndex) {
    return <span className="text-jacob border-jacob rounded-lg border px-1.5 text-[10px] font-semibold">{t('faster')}</span>
  }
  return null
}
