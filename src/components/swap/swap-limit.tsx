import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAssetFrom, useAssetTo } from '@/hooks/use-swap'
import { useLimitSwapExpiry, useSetLimitSwapBuyAmount, useSetLimitSwapExpiry } from '@/store/limit-swap-store'
import { USwapNumber } from '@uswap/core'
import { ThemeButton } from '@/components/theme-button'
import { DecimalInput } from '@/components/decimal/decimal-input'
import { Separator } from '@/components/ui/separator'
import { AssetIcon } from '@/components/asset-icon'
import { QuoteResponseRoute } from '@uswap/helpers/api'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

type PresetType = 5 | 10 | 'custom' | 'market'
type SwapLimitProps = { quote?: QuoteResponseRoute }

type ExpiryPreset = '1h' | '1d' | '1w' | undefined

const BLOCKS_PER_HOUR = 600
const BLOCKS_PER_DAY = 14400
const BLOCKS_PER_WEEK = 100800

export const SwapLimit = ({ quote }: SwapLimitProps) => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const setLimitSwapBuyAmount = useSetLimitSwapBuyAmount()
  const setLimitSwapExpiry = useSetLimitSwapExpiry()
  const limitSwapExpiry = useLimitSwapExpiry()

  const [pricePerUnit, setPricePerUnit] = useState<USwapNumber | undefined>()

  const sellAmount = useMemo(() => (quote ? new USwapNumber(quote.sellAmount) : null), [quote])

  const marketPricePerUnit = useMemo(() => {
    if (!quote || !sellAmount || sellAmount.eq(0)) return null
    return new USwapNumber(quote.expectedBuyAmount).div(sellAmount)
  }, [quote, sellAmount])

  useEffect(() => {
    setPricePerUnit(undefined)
    setLimitSwapBuyAmount(undefined)
    setLimitSwapExpiry(BLOCKS_PER_WEEK)
  }, [assetFrom?.identifier, assetTo?.identifier, setLimitSwapBuyAmount, setLimitSwapExpiry])

  useEffect(() => {
    if (marketPricePerUnit && !pricePerUnit) {
      setPricePerUnit(marketPricePerUnit)
    }
  }, [marketPricePerUnit, pricePerUnit])

  useEffect(() => {
    if (!pricePerUnit || !sellAmount) {
      return setLimitSwapBuyAmount(undefined)
    }
    const price = new USwapNumber(pricePerUnit)
    const totalBuyAmount = price.mul(sellAmount)
    setLimitSwapBuyAmount(totalBuyAmount.getBaseValue('string', 8))
  }, [pricePerUnit, sellAmount, setLimitSwapBuyAmount])

  const differencePercent = useMemo(() => {
    if (!marketPricePerUnit || !pricePerUnit) return null
    if (pricePerUnit.eq(0) || marketPricePerUnit.eq(0)) return null
    return pricePerUnit.sub(marketPricePerUnit).div(marketPricePerUnit).mul(100)
  }, [marketPricePerUnit, pricePerUnit])

  const activePreset = useMemo((): PresetType => {
    if (!differencePercent) return 'market'

    const diff = differencePercent.getValue('number')
    const tolerance = 0.1 // Allow small tolerance for floating point comparison

    if (Math.abs(diff) < tolerance) return 'market'
    if (Math.abs(diff - 5) < tolerance) return 5
    if (Math.abs(diff - 10) < tolerance) return 10

    return 'custom'
  }, [differencePercent])

  const applyPreset = (percent: number) => {
    if (!marketPricePerUnit) return
    if (percent === 0) {
      setPricePerUnit(marketPricePerUnit)
    } else {
      const newPrice = marketPricePerUnit.mul(1 + percent / 100)
      setPricePerUnit(newPrice)
    }
  }

  const resetToMarket = () => {
    if (!marketPricePerUnit) return
    setPricePerUnit(marketPricePerUnit)
  }

  const activeExpiryPreset = useMemo((): ExpiryPreset => {
    if (!limitSwapExpiry) return undefined
    if (limitSwapExpiry === BLOCKS_PER_HOUR) return '1h'
    if (limitSwapExpiry === BLOCKS_PER_DAY) return '1d'
    if (limitSwapExpiry === BLOCKS_PER_WEEK) return '1w'
    return undefined
  }, [limitSwapExpiry])

  const applyExpiryPreset = (preset: ExpiryPreset) => {
    switch (preset) {
      case '1h':
        return setLimitSwapExpiry(BLOCKS_PER_HOUR)
      case '1d':
        return setLimitSwapExpiry(BLOCKS_PER_DAY)
      case '1w':
        return setLimitSwapExpiry(BLOCKS_PER_WEEK)
      default:
        return setLimitSwapExpiry(undefined)
    }
  }

  return (
    <div className="px-6 pb-6">
      <Separator />

      <div className="flex items-center justify-between pt-4">
        <div className="text-thor-gray flex items-center text-sm font-medium">
          When 1 <AssetIcon asset={assetFrom} className="mx-1 h-4 w-4 bg-transparent" /> {assetFrom?.ticker} is worth
        </div>

        <div className="text-thor-gray flex items-center text-sm font-medium">
          Expiry
          <Select value={activeExpiryPreset || '1h'} onValueChange={v => applyExpiryPreset(v as ExpiryPreset)}>
            <SelectTrigger className="text-andy ml-1 h-auto w-auto border-none p-0 shadow-none" showIcon={false}>
              <ThemeButton className="h-6" variant="secondarySmall">
                {activeExpiryPreset || '1h'}
              </ThemeButton>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="1d">1 day</SelectItem>
              <SelectItem value="1w">1 week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DecimalInput
        className="text-leah my-3 w-full bg-transparent text-2xl font-medium outline-none"
        amount={(pricePerUnit ?? marketPricePerUnit)?.toSignificant() ?? ''}
        onAmountChange={v => setPricePerUnit(new USwapNumber(v))}
        autoComplete="off"
      />

      <div className="flex items-center space-x-1">
        {activePreset === 'custom' && differencePercent ? (
          <div className="flex items-center">
            <ThemeButton
              className="border-abraham bg-liquidity-green/20 h-6 rounded-r-none border-r px-2 text-xs"
              variant="secondarySmall"
            >
              {differencePercent.gte(0) ? '+' : ''}
              {differencePercent.toFixed(1)}%
            </ThemeButton>
            <ThemeButton
              className="bg-liquidity-green/20 h-6 rounded-l-none px-1"
              variant="secondarySmall"
              onClick={resetToMarket}
            >
              <X className="size-4" />
            </ThemeButton>
          </div>
        ) : (
          <ThemeButton
            className={cn('h-6', activePreset === 'market' && 'bg-liquidity-green/20')}
            variant="secondarySmall"
            onClick={() => applyPreset(0)}
          >
            Market
          </ThemeButton>
        )}

        <ThemeButton
          className={cn('h-6', activePreset === 5 && 'bg-liquidity-green/20')}
          variant="secondarySmall"
          onClick={() => applyPreset(5)}
        >
          +5%
        </ThemeButton>

        <ThemeButton
          className={cn('h-6', activePreset === 10 && 'bg-liquidity-green/20')}
          variant="secondarySmall"
          onClick={() => applyPreset(10)}
        >
          +10%
        </ThemeButton>
      </div>
    </div>
  )
}
