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
    label: 'Auto',
    icon: 'shield-check',
    className: 'text-remus'
  },
  flexible: {
    label: 'Flexible',
    icon: 'thumbs-up',
    className: 'text-blue-500'
  },
  precheck: {
    label: 'PreCheck',
    icon: 'target',
    className: 'text-leah'
  },
  controlled: {
    label: 'Controlled',
    icon: 'alert-circle',
    className: 'text-jacob'
  }
}

interface AmlPolicyBadgeProps {
  amlPolicy: AmlPolicy
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export const AmlPolicyBadge = ({ amlPolicy, className, onClick }: AmlPolicyBadgeProps) => {
  const meta = AML_POLICY_META[amlPolicy]
  if (!meta) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-blade flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold outline-none',
        meta.className,
        className
      )}
    >
      <Icon viewBox="0 0 16 16" name={meta.icon} className="size-4" />
      <span>{meta.label}</span>
    </button>
  )
}
