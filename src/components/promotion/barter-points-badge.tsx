import { ProviderName } from '@/types'

export const BarterPointsBadge = ({ provider }: { provider: ProviderName | 'CCE' }) => {
  if (provider !== ProviderName.BARTER) return null

  return <span className="text-jacob border-jacob ms-2 rounded-lg border px-1.5 text-[10px] font-semibold">+POINTS</span>
}
