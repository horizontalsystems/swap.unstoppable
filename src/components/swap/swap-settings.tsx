import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useSetSlippage, useSetStreamingInterval, useSlippage, useStreamingInterval } from '@/hooks/use-swap'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ThemeButton } from '@/components/theme-button'
import { Slider } from '@/components/ui/slider'
import { InfoTooltip } from '@/components/tooltip'
import { Icon } from '@/components/icons'
import { INITIAL_SLIPPAGE, INITIAL_STREAMING_INTERVAL } from '@/store/swap-store'
import { Separator } from '@/components/ui/separator'

const slippageValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10]
const streamingIntervalValues = [0, 1, 3, 5, 10]

export const SwapSettings = () => {
  const slippage = useSlippage()
  const setSlippage = useSetSlippage()
  const streamingInterval = useStreamingInterval()
  const setStreamingInterval = useSetStreamingInterval()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [sliderValue, setSliderValue] = useState([toSliderValue(slippage)])
  const [streamingSliderValue, setStreamingSliderValue] = useState([streamingInterval])

  const enabledSteps = [...Array(22).keys(), 25]
  const ramExpansions = [slippageValues[0], 'No Protection']
  const currentSlippage = slippageValues[sliderValue[0]]
  const currentStreamingInterval = streamingIntervalValues[streamingSliderValue[0]]

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
          setStreamingSliderValue([toStreamingSliderValue(streamingInterval)])
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
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm font-semibold">
              <div className="flex items-center gap-1">
                <span>Slippage Tolerance</span>
                <InfoTooltip>
                  Due to market volatility, prices may change before completion. This setting ensures you receive at
                  least your minimum amount.
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

          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm font-semibold">
              <div className="flex items-center gap-1">
                <span>Streaming Interval</span>
                <InfoTooltip>
                  Swap interval in blocks: 0 = rapid streaming (multiple sub-swaps per block), ≥1 = traditional
                  streaming (one sub-swap per X blocks)
                </InfoTooltip>
              </div>
              <span>{currentStreamingInterval} blocks</span>
            </div>
            <span className="text-thor-gray text-xs">
              If your protocol supports streaming swaps, you can adjust the interval here.
            </span>
          </div>
          <div className="w-full">
            <Slider
              max={streamingIntervalValues.length - 1}
              value={streamingSliderValue}
              onValueChange={setStreamingSliderValue}
              classNameRange="bg-liquidity-green"
            />
            <div className="text-thor-gray mt-3 flex items-center justify-between text-[10px] font-semibold">
              <span>Fastest</span>
              <span>Optimal</span>
              <span>Slowest</span>
            </div>
          </div>

          <div className="flex gap-6">
            <ThemeButton
              variant="secondarySmall"
              className="flex-1"
              onClick={() => {
                setSlippage(INITIAL_SLIPPAGE)
                setStreamingInterval(INITIAL_STREAMING_INTERVAL)
                setDropdownOpen(false)
              }}
              disabled={slippage === INITIAL_SLIPPAGE && streamingInterval === INITIAL_STREAMING_INTERVAL}
            >
              Reset
            </ThemeButton>

            <ThemeButton
              variant="primarySmall"
              className="flex-1"
              onClick={() => {
                setSlippage(currentSlippage)
                setStreamingInterval(currentStreamingInterval)
                setDropdownOpen(false)
              }}
              disabled={currentSlippage === slippage && currentStreamingInterval === streamingInterval}
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

function toStreamingSliderValue(interval: number) {
  const index = streamingIntervalValues.indexOf(interval)
  return index !== -1 ? index : 0
}
