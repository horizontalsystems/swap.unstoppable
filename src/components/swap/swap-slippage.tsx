import { SlidersHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useSetSlippageLimit, useSlippageLimit } from '@/hook/use-swap'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const SwapSlippage = () => {
  const slippageLimit = useSlippageLimit()
  const setSlippageLimit = useSetSlippageLimit()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="bg-bran rounded-full px-2 py-2">
          <SlidersHorizontal className="h-4 w-4 cursor-pointer" />
        </button>
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
