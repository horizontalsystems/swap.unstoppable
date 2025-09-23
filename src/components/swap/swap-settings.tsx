import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useSetSlippage, useSlippage } from '@/hooks/use-swap'
import { ThemeButton } from '@/components/theme-button'
import { Icon } from '@/components/icons'
import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { INITIAL_SLIPPAGE } from '@/store/swap-store'

export const SwapSettings = () => {
  const slippage = useSlippage()
  const setSlippage = useSetSlippage()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [sliderValue, setSliderValue] = useState([toSliderValue(slippage)])

  const enabledSteps = [...Array(20).keys(), 25]
  const ramExpansions = [toSlippageValue(0), 'No Protection']
  const currentSlippage = toSlippageValue(sliderValue[0])

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
      <DropdownMenuContent className="bg-lawrence max-w-sm rounded-2xl border-0 p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="font-semibold">
              Price Protection - {currentSlippage ? `${currentSlippage}%` : 'No Protection'}
            </span>
            <span className="text-thor-gray text-xs">
              Your deposit will be refunded if the price changes unfavourable above this percentage.
            </span>
          </div>
          <div className="">
            <div className="w-full">
              <Slider max={25} value={sliderValue} onValueChange={handleValueChange} />
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
                setSlippage(toSlippageValue(sliderValue[0]))
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
    return slippage / 0.5 - 1
  } else {
    return 25
  }
}

function toSlippageValue(value: number) {
  if (value === 25) {
    return undefined
  } else {
    return (value + 1) * 0.5
  }
}
