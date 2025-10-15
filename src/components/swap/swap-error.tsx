import { translateError } from '@/lib/errors'
import { Icon } from '@/components/icons'

export const SwapError = ({ error }: { error: Error | null }) => {
  if (!error) return null

  return (
    <div className="text-lucian flex items-center gap-2 px-4 py-2 text-sm">
      <Icon name="warning" className="size-4 shrink-0" />
      {translateError(error?.message || 'Unknown Error')}
    </div>
  )
}
