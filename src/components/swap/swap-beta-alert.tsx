import { OctagonAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ThemeButton } from '@/components/theme-button'

export const SwapBetaAlert = () => {
  return (
    <Alert className="bg-lawrence text-storm-purple mb-4 flex items-center justify-between rounded-4xl border-0 p-4">
      <div className="flex items-center gap-3">
        <OctagonAlert className="" size={24} min={24} />
        <div>
          <AlertTitle className="text-leah font-semibold">This is a beta test site</AlertTitle>
          <AlertDescription className="text-xs">The official URL will be swap.thorchain.org</AlertDescription>
        </div>
      </div>
      <ThemeButton variant="secondarySmall">
        <a href="https://gitlab.com/thorchain/client/ui/-/issues" rel="noopener noreferrer" target="_blank">
          Report Bug
        </a>
      </ThemeButton>
    </Alert>
  )
}
