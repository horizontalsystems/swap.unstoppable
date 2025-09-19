import { InsufficientAllowanceError, translateError } from 'rujira.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icon } from '@/components/icons'

export const SwapWarning = ({ error }: { error: Error | null }) => {
  if (error instanceof InsufficientAllowanceError) {
    return null
  }

  if (error) {
    return (
      <Alert className="bg-lawrence mt-4 rounded-2xl border-0 px-4" variant="destructive">
        <Icon name="warning" className="size-4 shrink-0" />
        <AlertDescription>{translateError(error?.message || 'Unknown Error')}</AlertDescription>
      </Alert>
    )
  }

  return null
}
