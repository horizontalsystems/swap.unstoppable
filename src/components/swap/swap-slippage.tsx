import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useSetSlippageLimit, useSlippageLimit } from '@/hooks/use-swap'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ThemeButton } from '@/components/theme-button'
import { Icon } from '@/components/icons'

export const SwapSlippage = () => {
  const slippageLimit = useSlippageLimit()
  const setSlippageLimit = useSetSlippageLimit()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ThemeButton variant="circleSmall">
          <Icon name="manage" />
        </ThemeButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="flex gap-2 p-2">
          <Button
            className={cn('text-leah bg-blade rounded-lg px-3 py-1 text-sm hover:bg-zinc-700', {
              'bg-zinc-700': slippageLimit === '100'
            })}
            onClick={() => setSlippageLimit(100n)}
          >
            1%
          </Button>
          <Button
            className={cn('text-leah bg-blade rounded-lg px-3 py-1 text-sm hover:bg-zinc-700', {
              'bg-zinc-700': slippageLimit === '200'
            })}
            onClick={() => setSlippageLimit(200n)}
          >
            2%
          </Button>
          <Button
            className={cn('text-leah bg-blade rounded-lg px-3 py-1 text-sm hover:bg-zinc-700', {
              'bg-zinc-700': slippageLimit === '500'
            })}
            onClick={() => setSlippageLimit(500n)}
          >
            5%
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
