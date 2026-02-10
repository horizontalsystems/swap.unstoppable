import { useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Icon } from '@/components/icons'
import { ThemeButton } from '@/components/theme-button'
import { InfoTooltip } from '@/components/tooltip'
import {
  useCustomInterval,
  useCustomQuantity,
  useSetCustomInterval,
  useSetCustomQuantity,
  useSetSlippage,
  useSetTwapMode,
  useSlippage,
  useTwapMode
} from '@/hooks/use-swap'
import { cn } from '@/lib/utils'
import { INITIAL_CUSTOM_INTERVAL, INITIAL_CUSTOM_QUANTITY, INITIAL_SLIPPAGE, INITIAL_TWAP_MODE, TwapMode } from '@/store/swap-store'

const slippageValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10]
const numberOfTradesValues = [1, 5, 10, 15, 20, 25, 30, 50, 100]
const timeBetweenTradesOptions = [
  { blocks: 10, label: '1 min' },
  { blocks: 50, label: '5 min' },
  { blocks: 100, label: '10 min' },
  { blocks: 300, label: '30 min' },
  { blocks: 600, label: '1 hour' }
]

function quantityToSliderIndex(quantity: number): number {
  const index = numberOfTradesValues.indexOf(quantity)
  return index !== -1 ? index : 1
}

export const SwapSettings = () => {
  const slippage = useSlippage()
  const setSlippage = useSetSlippage()
  const twapMode = useTwapMode()
  const setTwapMode = useSetTwapMode()
  const customInterval = useCustomInterval()
  const setCustomInterval = useSetCustomInterval()
  const customQuantity = useCustomQuantity()
  const setCustomQuantity = useSetCustomQuantity()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [sliderValue, setSliderValue] = useState([toSliderValue(slippage)])
  const [localTwapMode, setLocalTwapMode] = useState<TwapMode>(twapMode)
  const [localCustomInterval, setLocalCustomInterval] = useState(customInterval)
  const [localCustomQuantity, setLocalCustomQuantity] = useState(customQuantity)

  const enabledSteps = [...Array(22).keys(), 25]
  const ramExpansions = [slippageValues[0], 'No Protection']
  const currentSlippage = slippageValues[sliderValue[0]]

  const handleValueChange = (newValue: [number]) => {
    const targetValue = newValue[0]

    let closestStep = enabledSteps[0]
    let minDistance = Math.abs(targetValue - enabledSteps[0])

    for (const step of enabledSteps) {
      const distance = Math.abs(targetValue - step)
      if (distance < minDistance) {
        minDistance = distance
        closestStep = step
      }
    }

    setSliderValue([closestStep])
  }

  return (
    <DropdownMenu
      open={dropdownOpen}
      onOpenChange={open => {
        if (open) {
          setSliderValue([toSliderValue(slippage)])
          setLocalTwapMode(twapMode)
          setLocalCustomInterval(customInterval)
          setLocalCustomQuantity(customQuantity)
        }

        setDropdownOpen(open)
      }}
    >
      <DropdownMenuTrigger asChild>
        <ThemeButton variant="circleSmall">
          <Icon name="manage" />
        </ThemeButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-sm p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm font-semibold">
              <div className="flex items-center gap-1">
                <span>Slippage Tolerance</span>
                <InfoTooltip>
                  Due to market volatility, prices may change before completion. This setting ensures you receive at least your minimum amount.
                </InfoTooltip>
              </div>
              <span>{currentSlippage ? `${currentSlippage}%` : 'No Protection'}</span>
            </div>
            <span className="text-thor-gray text-xs">
              Maximum acceptable price change. Transaction will fail if the price moves unfavorably beyond this amount.
            </span>
          </div>
          <div className="w-full">
            <Slider
              max={25}
              value={sliderValue}
              onValueChange={handleValueChange}
              classNameRange={cn({
                'bg-liquidity-green': currentSlippage && currentSlippage <= 3,
                'bg-jacob': currentSlippage && currentSlippage > 3,
                'bg-lucian': !currentSlippage
              })}
            />
            <div className="text-thor-gray mt-3 flex items-center justify-between text-[10px] font-semibold">
              {ramExpansions.map(expansion => (
                <span key={expansion}>{expansion}</span>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm font-semibold">
              <div className="flex items-center gap-1">
                <span>TWAP (Time Weighted Average Price)</span>
                <InfoTooltip>
                  Relevant for large volume swaps only. Best Price offers optimum price for the order. Best Time prioritizes swap execution time
                  (whenever possible). Custom lets you configure the number of mini-swaps the swap should be broken into and time between each
                  mini-swapt.
                </InfoTooltip>
              </div>
            </div>
            <span className="text-thor-gray text-xs">Time Weighted Average Price</span>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-blade flex rounded-full">
              {(['bestPrice', 'bestTime', 'custom'] as const).map(mode => (
                <ThemeButton
                  key={mode}
                  variant={localTwapMode === mode ? 'primarySmall' : 'secondarySmall'}
                  className="flex-1"
                  onClick={() => setLocalTwapMode(mode)}
                >
                  {mode === 'bestPrice' && 'Best Price'}
                  {mode === 'bestTime' && 'Best Time'}
                  {mode === 'custom' && 'Custom'}
                </ThemeButton>
              ))}
            </div>
            {localTwapMode === 'custom' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Number of sub-swaps</span>
                    <span className="text-xs font-semibold">{localCustomQuantity}</span>
                  </div>
                  <span className="text-thor-gray text-xs">
                    How many sub-swaps to split your trade into. More trades = better price, longer execution.
                  </span>
                </div>
                <div className="w-full">
                  <Slider
                    max={numberOfTradesValues.length - 1}
                    value={[quantityToSliderIndex(localCustomQuantity)]}
                    onValueChange={([index]) => setLocalCustomQuantity(numberOfTradesValues[index])}
                    classNameRange="bg-liquidity-green"
                  />
                  <div className="text-thor-gray mt-3 flex items-center justify-between text-[10px] font-semibold">
                    <span>{numberOfTradesValues[0]}</span>
                    <span>{numberOfTradesValues[numberOfTradesValues.length - 1]}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Time between sub-swaps</span>
                  <span className="text-thor-gray text-xs">
                    Delay between each sub-swap. Longer intervals allow pools to rebalance for better pricing.
                  </span>
                  <Select value={localCustomInterval.toString()} onValueChange={value => setLocalCustomInterval(Number(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeBetweenTradesOptions.map(opt => (
                        <SelectItem key={opt.blocks} value={opt.blocks.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-6">
            <ThemeButton
              variant="secondarySmall"
              className="flex-1"
              onClick={() => {
                setSlippage(INITIAL_SLIPPAGE)
                setTwapMode(INITIAL_TWAP_MODE)
                setCustomInterval(INITIAL_CUSTOM_INTERVAL)
                setCustomQuantity(INITIAL_CUSTOM_QUANTITY)
                setDropdownOpen(false)
              }}
              disabled={
                slippage === INITIAL_SLIPPAGE &&
                twapMode === INITIAL_TWAP_MODE &&
                customInterval === INITIAL_CUSTOM_INTERVAL &&
                customQuantity === INITIAL_CUSTOM_QUANTITY
              }
            >
              Reset
            </ThemeButton>

            <ThemeButton
              variant="primarySmall"
              className="flex-1"
              onClick={() => {
                setSlippage(currentSlippage)
                setTwapMode(localTwapMode)
                setCustomInterval(localCustomInterval)
                setCustomQuantity(localCustomQuantity)
                setDropdownOpen(false)
              }}
              disabled={
                currentSlippage === slippage &&
                localTwapMode === twapMode &&
                localCustomInterval === customInterval &&
                localCustomQuantity === customQuantity
              }
            >
              Save
            </ThemeButton>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function toSliderValue(slippage?: number) {
  if (slippage) {
    const index = slippageValues.indexOf(slippage)
    if (index !== -1) return index
  }

  return 25
}
