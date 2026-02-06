'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, LoaderCircle } from 'lucide-react'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ThemeButton } from '@/components/theme-button'
import { Asset } from '@/components/swap/asset'
import { AssetIcon } from '@/components/asset-icon'
import { DecimalText } from '@/components/decimal/decimal-text'
import { chainLabel } from '@/components/connect-wallet/config'
import { getUSwap } from '@/lib/wallets'
import { getInboundAddresses } from '@/lib/api'
import { createCancelLimitSwapMemo } from '@/lib/limit-swap'
import { toast } from 'sonner'
import { AssetValue, FeeOption } from '@tcswap/core'
import { useSelectedAccount } from '@/hooks/use-wallets'
import { SwapError } from '@/components/swap/swap-error'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { InboundAddressesItem } from '@tcswap/helpers/api'

interface SwapLimitCancelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    hash?: string
    assetFrom: Asset
    assetTo: Asset
    amountFrom: string
    amountTo: string
    addressFrom?: string
    limitSwapMemo?: string
  }
}

export const SwapLimitCancel = ({ isOpen, onOpenChange, transaction }: SwapLimitCancelProps) => {
  const uSwap = getUSwap()
  const selectedAccount = useSelectedAccount()
  const [inboundAddresses, setInboundAddresses] = useState<InboundAddressesItem[]>([])
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<Error | undefined>()

  const { hash, assetFrom, assetTo, amountFrom, amountTo, addressFrom, limitSwapMemo } = transaction

  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    setError(undefined)

    getInboundAddresses()
      .then(addresses => setInboundAddresses(addresses))
      .catch(() => setError(new Error('Failed to load inbound addresses')))
      .finally(() => setLoading(false))
  }, [isOpen])

  const inboundAddress = inboundAddresses.find(addr => addr.chain === assetFrom.chain)

  const addressMatch =
    !addressFrom || !selectedAccount || selectedAccount.address.toLowerCase() === addressFrom.toLowerCase()

  const canCancel =
    selectedAccount &&
    selectedAccount.network === assetFrom.chain &&
    addressMatch &&
    hash &&
    limitSwapMemo &&
    inboundAddress &&
    !inboundAddress.halted &&
    !inboundAddress.chain_trading_paused

  const onCancel = async () => {
    if (!canCancel || !hash || !inboundAddress?.address || !selectedAccount) return

    setCancelling(true)
    setError(undefined)

    try {
      const cancelMemo = createCancelLimitSwapMemo(limitSwapMemo, amountFrom, assetFrom, assetTo)
      console.log({ cancelMemo })
      const dustThreshold = BigInt(inboundAddress.dust_threshold || '0')
      const minAmount = dustThreshold > 0n ? dustThreshold : 10000n
      const sendAmount = (minAmount * 2n).toString()
      const assetValue = AssetValue.from({
        chain: assetFrom.chain,
        value: sendAmount,
        fromBaseDecimal: 8
      })

      const hash = await uSwap.transfer({
        assetValue,
        recipient: inboundAddress.address,
        memo: cancelMemo,
        feeOptionKey: FeeOption.Fast
      })

      console.log({ hash })

      toast.success('Cancel transaction submitted')
      onOpenChange(false)
    } catch (err: any) {
      console.error('Failed to cancel limit swap:', err)
      setError(new Error(err.message || 'Failed to cancel limit swap'))
    } finally {
      setCancelling(false)
    }
  }

  const renderWarnings = () => {
    const warnings: string[] = []

    if (!selectedAccount) {
      warnings.push(`Connect a ${chainLabel(assetFrom.chain)} wallet to cancel this order`)
    } else if (selectedAccount.network !== assetFrom.chain) {
      warnings.push(`Switch to a ${chainLabel(assetFrom.chain)} wallet to cancel this order`)
    } else if (addressFrom && selectedAccount.address.toLowerCase() !== addressFrom.toLowerCase()) {
      warnings.push(`Connected wallet does not match the address that placed this order`)
    }

    if (!hash) {
      warnings.push('Transaction hash not available yet')
    }

    if (inboundAddress?.halted || inboundAddress?.chain_trading_paused) {
      warnings.push(`${chainLabel(assetFrom.chain)} trading is currently paused`)
    }

    if (warnings.length === 0) return null

    return (
      <div className="bg-jacob/10 border-jacob/30 flex items-start gap-3 rounded-xl border p-4">
        <AlertTriangle className="text-jacob mt-0.5 size-5 shrink-0" />
        <div className="text-jacob space-y-1 text-sm">
          {warnings.map((warning, i) => (
            <p key={i}>{warning}</p>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-xl">
        <CredenzaHeader>
          <CredenzaTitle>Cancel Limit Order</CredenzaTitle>
        </CredenzaHeader>

        <ScrollArea className="relative flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
          <div className="mb-4 space-y-4">
            <div className="rounded-xl border">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <AssetIcon asset={assetFrom} />
                  <div className="flex flex-col">
                    <span className="text-leah text-sm font-semibold">{assetFrom.ticker}</span>
                    <span className="text-thor-gray text-xs">{chainLabel(assetFrom.chain)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-leah text-sm font-semibold">
                    <DecimalText amount={amountFrom} symbol={assetFrom.ticker} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t p-4">
                <div className="flex items-center gap-3">
                  <AssetIcon asset={assetTo} />
                  <div className="flex flex-col">
                    <span className="text-leah text-sm font-semibold">{assetTo.ticker}</span>
                    <span className="text-thor-gray text-xs">{chainLabel(assetTo.chain)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-leah text-sm font-semibold">
                    <DecimalText amount={amountTo} symbol={assetTo.ticker} />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-thor-gray text-sm">
              Cancelling this limit order will return your deposited funds to your wallet. A small network fee will be
              charged to process the cancellation.
            </p>

            {renderWarnings()}

            {error && <SwapError error={error} />}
          </div>

          <div className="from-lawrence pointer-events-none absolute inset-x-0 -bottom-px h-4 bg-linear-to-t to-transparent" />
        </ScrollArea>

        <div className="p-4 pt-2 md:p-8 md:pt-2">
          <ThemeButton
            variant="primaryMedium"
            className="w-full"
            onClick={onCancel}
            disabled={!canCancel || cancelling || loading}
          >
            {(cancelling || loading) && <LoaderCircle size={20} className="animate-spin" />}
            <span>{cancelling ? 'Cancelling...' : loading ? 'Loading...' : 'Cancel Order'}</span>
          </ThemeButton>
        </div>
      </CredenzaContent>
    </Credenza>
  )
}
