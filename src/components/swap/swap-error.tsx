import { Icon } from '@/components/icons'
import { translateError } from '@/lib/errors'

export const SwapError = ({ error }: { error: Error }) => {
  return (
    <div className="text-lucian flex items-center gap-2 text-sm">
      <Icon name="warning" className="size-4 shrink-0" />
      {translateError(error.message || 'Unknown Error')}
    </div>
  )
}
