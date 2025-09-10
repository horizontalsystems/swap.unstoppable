import { InsufficientAllowanceError, translateError } from 'rujira.js'
import { OctagonAlert } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const SwapWarning = ({ error }: { error: Error | null }) => {
  if (error instanceof InsufficientAllowanceError) {
    return null
  }

  if (error) {
    return (
      <Alert className="bg-lawrence mt-4 rounded-2xl border-0 px-4" variant="destructive">
        <OctagonAlert size={16} min={16} />
        <AlertDescription>{translateError(error?.message || 'Unknown Error')}</AlertDescription>
      </Alert>
    )
  }

  return null
}
