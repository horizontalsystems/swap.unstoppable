import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useSetSlippage, useSlippage } from '@/hooks/use-swap'
import { ThemeButton } from '@/components/theme-button'
import { Icon } from '@/components/icons'
import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { INITIAL_SLIPPAGE } from '@/store/swap-store'
import { cn } from '@/lib/utils'
import { InfoTooltip } from '@/components/info-tooltip'

const slippageValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10]

export const SwapSettings = () => {
  const slippage = useSlippage()
  const setSlippage = useSetSlippage()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [sliderValue, setSliderValue] = useState([toSliderValue(slippage)])

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
          <div className="">
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
          </div>

          <div className="flex gap-6">
            <ThemeButton
              variant="secondarySmall"
              className="flex-1"
              onClick={() => {
                setSlippage(INITIAL_SLIPPAGE)
                setDropdownOpen(false)
              }}
              disabled={slippage === INITIAL_SLIPPAGE}
            >
              Reset
            </ThemeButton>

            <ThemeButton
              variant="primarySmall"
              className="flex-1"
              onClick={() => {
                setSlippage(slippageValues[sliderValue[0]])
                setDropdownOpen(false)
              }}
              disabled={currentSlippage === slippage}
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
