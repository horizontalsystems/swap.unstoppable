import { MouseEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Icon, IconName } from '@/components/icons'
import { cn } from '@/lib/utils'
import { RiskLevel } from '@/types'

interface RiskLevelMeta {
  label: string
  icon: IconName
  className: string
}

export const RISK_LEVEL_META: Record<RiskLevel, RiskLevelMeta> = {
  excellent: { label: 'Excellent', icon: 'star', className: 'text-remus' },
  good: { label: 'Good', icon: 'shield-check', className: 'text-blue-500' },
  fair: { label: 'Fair', icon: 'thumbs-up', className: 'text-jacob' }
}

interface RiskLevelBadgeProps {
  riskLevel: RiskLevel
  onClick?: (e: MouseEvent) => void
}

export const RiskLevelBadge = ({ riskLevel, onClick }: RiskLevelBadgeProps) => {
  const t = useTranslations('riskLevel')
  const meta = RISK_LEVEL_META[riskLevel]
  if (!meta) return null
  return (
    <button
      className={cn(
        'border-blade box-border flex h-8 cursor-pointer items-center gap-1 rounded-xl border px-2 text-xs font-semibold',
        meta.className
      )}
      onClick={onClick}
    >
      <Icon viewBox="0 0 16 16" name={meta.icon} className="size-4" />
      <span>{t(riskLevel)}</span>
    </button>
  )
}
