import { useEffect, useState } from 'react'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ThemeButton } from '@/components/theme-button'
import { getSwapKitQuote } from '@/lib/api'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { useWallets } from '@/hooks/use-wallets'
import { QuoteResponseRoute } from '@swapkit/api'
import { AxiosError } from 'axios'
import { truncate } from '@/lib/utils'
import { AssetIcon } from '@/components/asset-icon'
import { LoaderCircle } from 'lucide-react'
import { CopyButton } from '@/components/button-copy'
import { resolveFees } from '@/components/swap/swap-helpers'
import { formatDuration, intervalToDuration } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Icon } from '@/components/icons'
import { translateError } from '@/lib/errors'
import { toast } from 'sonner'
import { FeeOption, getChainConfig, SwapKitNumber } from '@swapkit/core'
import { getSwapKit } from '@/lib/wallets'
import { transactionStore } from '@/store/transaction-store'
import { useBalance } from '@/hooks/use-balance'
import { chainLabel } from '@/components/connect-wallet/config'

interface SwapConfirmProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const SwapConfirm = ({ isOpen, onOpenChange }: SwapConfirmProps) => {
  const swapKit = getSwapKit()
  const { valueFrom, destination, slippage, setAmountFrom } = useSwap()
  const { refetch: refetchBalance } = useBalance()
  const { selected } = useWallets()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { setTransaction } = transactionStore()

  const [quote, setQuote] = useState<QuoteResponseRoute | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getQuote()
  }, [])

  const getQuote = () => {
    if (!assetFrom || !assetTo || !selected || !destination) return

    getSwapKitQuote({
      buyAsset: assetTo.asset,
      destinationAddress: destination.address,
      sellAmount: valueFrom.toSignificant(),
      sellAsset: assetFrom.asset,
      affiliate: process.env.NEXT_PUBLIC_AFFILIATE,
      affiliateFee: Number(process.env.NEXT_PUBLIC_AFFILIATE_FEE),
      sourceAddress: selected.address,
      includeTx: true,
      slippage: slippage
    })
      .then(res => {
        setQuote(res)
      })
      .catch(error => {
        let newError = error

        if (error instanceof AxiosError) {
          const errors = error.response?.data?.providerErrors
          if (errors && errors[0]?.message) {
            newError = new Error(errors[0]?.message)
          } else {
            newError = new Error(error.response?.data?.message || error.message)
          }
        }

        setError(newError.message || 'Error fetching quote')
      })
  }

  const onConfirm = () => {
    if (!selected || !quote || !assetFrom || !assetTo) {
      return
    }

    setSubmitting(true)

    const broadcast = swapKit
      .swap({
        route: quote as any,
        feeOptionKey: FeeOption.Fast
      })
      .then((hash: string) => {
        setTransaction({
          chainId: getChainConfig(assetFrom.chain).chainId,
          hash: hash,
          timestamp: new Date(),
          assetFrom: assetFrom,
          assetTo: assetTo,
          amountFrom: valueFrom.toSignificant(),
          amountTo: new SwapKitNumber(quote.expectedBuyAmount).toSignificant(),
          status: 'pending'
        })

        setAmountFrom('')
        refetchBalance()

        onOpenChange(false)
      })
      .catch((err: any) => {
        console.log(err)
        setSubmitting(false)
        throw err
      })

    toast.promise(broadcast, {
      loading: 'Submitting Transaction',
      success: () => 'Transaction submitted',
      error: (err: any) => {
        console.log(err)
        return 'Error Submitting Transaction'
      }
    })
  }

  const renderQuote = (quote: QuoteResponseRoute) => {
    if (!assetFrom || !assetTo) return

    const sellAmount = new SwapKitNumber(quote.sellAmount)
    const expectedBuyAmount = new SwapKitNumber(quote.expectedBuyAmount)
    const expectedBuyAmountMaxSlippage = new SwapKitNumber(quote.expectedBuyAmountMaxSlippage)

    const rawPriceFrom = quote.meta.assets?.find(a => a.asset.toLowerCase() === assetFrom.asset.toLowerCase())?.price
    const priceFrom = rawPriceFrom && new SwapKitNumber(rawPriceFrom)

    const rawPriceTo = quote.meta.assets?.find(a => a.asset.toLowerCase() === assetTo.asset.toLowerCase())?.price
    const priceTo = rawPriceTo && new SwapKitNumber(rawPriceTo)

    const { total: totalFee } = resolveFees(quote)

    const slippage = new SwapKitNumber(quote.totalSlippageBps).div(-100)

    return (
      <div className="overflow-hidden">
        <ScrollArea className="h-full px-4 md:px-8">
          <div className="border-blade mb-4 rounded-xl border-1 md:mb-8">
            <div className="relative flex flex-col">
              <div className="text-thor-gray flex justify-between p-4 text-sm">
                <div className="flex items-center gap-4">
                  <AssetIcon asset={assetFrom} />
                  <div className="flex flex-col">
                    <span className="text-leah text-base font-semibold">{assetFrom.metadata.symbol}</span>
                    <span className="text-thor-gray text-sm">{chainLabel(assetFrom.chain)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-leah text-base font-semibold">{sellAmount.toSignificant()}</span>
                  <span className="text-thor-gray text-sm">
                    {priceFrom ? sellAmount.mul(priceFrom).toCurrency() : 'n/a'}
                  </span>
                </div>
              </div>

              <div className="text-thor-gray flex justify-between border-t p-4 text-sm">
                <div className="flex items-center gap-4">
                  <AssetIcon asset={assetTo} />
                  <div className="flex flex-col">
                    <span className="text-leah text-base font-semibold">{assetTo.metadata.symbol}</span>
                    <span className="text-thor-gray text-sm">{chainLabel(assetTo.chain)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-leah text-base font-semibold">{expectedBuyAmount.toSignificant()}</span>
                  <span className="text-thor-gray text-sm">
                    {priceTo ? expectedBuyAmount.mul(priceTo).toCurrency() : 'n/a'}
                  </span>
                </div>
              </div>

              <div className="bg-lawrence absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2">
                <Icon name="arrow-m-down" className="text-thor-gray size-5" />
              </div>
            </div>

            <div className="text-thor-gray flex justify-between border-t p-4 text-sm">
              <span>Min. payout</span>
              <div className="flex gap-2">
                <span className="text-leah font-semibold">
                  {expectedBuyAmountMaxSlippage.toSignificant()} {assetTo.metadata.symbol}
                </span>
                {priceTo && (
                  <span className="font-medium">({expectedBuyAmountMaxSlippage.mul(priceTo).toCurrency()})</span>
                )}
              </div>
            </div>

            <div className="space-y-4 border-t p-4">
              <div className="text-thor-gray flex justify-between text-sm">
                <span>Source Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-leah font-semibold">{truncate(quote.sourceAddress)}</span>
                  <CopyButton text={quote.sourceAddress} />
                </div>
              </div>

              <div className="text-thor-gray flex justify-between text-sm">
                <span>Destination Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-leah font-semibold">{truncate(quote.destinationAddress)}</span>
                  <CopyButton text={quote.destinationAddress} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-blade space-y-4 rounded-xl border-1 p-4">
            <div className="text-thor-gray flex justify-between text-sm">
              <span>Fee</span>
              <span className="text-leah font-semibold">{totalFee.toCurrency()}</span>
            </div>

            {quote.estimatedTime && (
              <div className="text-thor-gray flex justify-between text-sm">
                <span>Estimated Time</span>
                <span className="text-leah font-semibold">
                  {formatDuration(
                    intervalToDuration({
                      start: 0,
                      end: (quote.estimatedTime.total || 0) * 1000
                    }),
                    { format: ['hours', 'minutes', 'seconds'], zero: false }
                  )}
                </span>
              </div>
            )}

            <div className="text-thor-gray flex justify-between text-sm">
              <span>Slippage</span>
              <span className="text-leah font-semibold">{slippage.toSignificant(3)}%</span>
            </div>
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="md:max-w-xl">
        <CredenzaHeader>
          <CredenzaTitle>Confirm Swap</CredenzaTitle>
        </CredenzaHeader>

        <div className="flex h-full flex-col justify-between overflow-hidden">
          {quote ? (
            renderQuote(quote)
          ) : error ? (
            <div className="text-lucian flex h-full w-full flex-col items-center justify-center gap-6 px-8 md:px-16">
              <Icon name="warning" className="size-8 shrink-0" />
              <span className="text-center text-sm">{translateError(error)}</span>
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-6">
              <LoaderCircle className="animate-spin" size={32} />
              <span className="text-leah text-sm">Preparing Swap...</span>
            </div>
          )}
          <div className="p-4 md:p-8">
            <ThemeButton
              variant="primaryMedium"
              className="w-full"
              onClick={() => onConfirm()}
              disabled={!quote || submitting}
            >
              {submitting ? <LoaderCircle size={20} className="animate-spin" /> : <span>Confirm</span>}
            </ThemeButton>
          </div>
        </div>
      </CredenzaContent>
    </Credenza>
  )
}
