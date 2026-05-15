import { Icon, IconName } from '@/components/icons'
import { cn } from '@/lib/utils'
import { AmlPolicy } from '@/types'

interface AmlPolicyMeta {
  label: string
  icon: IconName
  className: string
}

const AML_POLICY_META: Record<AmlPolicy, AmlPolicyMeta> = {
  auto: {
    label: 'Excellent',
    icon: 'star',
    className: 'text-remus'
  },
  flexible: {
    label: 'Good',
    icon: 'shield-check',
    className: 'text-blue-500'
  },
  precheck: {
    label: 'Good',
    icon: 'shield-check',
    className: 'text-blue-500'
  },
  controlled: {
    label: 'Fair',
    icon: 'thumbs-up',
    className: 'text-jacob'
  }
}

interface AmlPolicyBadgeProps {
  amlPolicy: AmlPolicy
  onClick?: (e: React.MouseEvent) => void
}

export const AmlPolicyBadge = ({ amlPolicy, onClick }: AmlPolicyBadgeProps) => {
  const meta = AML_POLICY_META[amlPolicy]
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
      <span>{meta.label}</span>
    </button>
  )
}
