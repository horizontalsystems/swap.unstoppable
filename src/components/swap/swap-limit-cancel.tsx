'use client'

import { useEffect, useMemo, useState } from 'react'
import { AssetValue, FeeOption, USwapNumber } from '@uswap/core'
import type { InboundAddressesItem } from '@uswap/helpers/api'
import { AlertTriangle, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AssetIcon } from '@/components/asset-icon'
import { chainLabel } from '@/components/connect-wallet/config'
import { DecimalInput } from '@/components/decimal/decimal-input'
import { DecimalText } from '@/components/decimal/decimal-text'
import { Asset } from '@/components/swap/asset'
import { SwapError } from '@/components/swap/swap-error'
import { ThemeButton } from '@/components/theme-button'
import { useSelectedAccount } from '@/hooks/use-wallets'
import { getInboundAddresses } from '@/lib/api'
import { createCancelLimitSwapMemo, createModifyLimitSwapMemo } from '@/lib/memo-helpers'
import { getUSwap } from '@/lib/wallets'

interface SwapLimitCancelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  mode: 'cancel' | 'modify'
  transaction: {
    assetFrom: Asset
    assetTo: Asset
    amountFrom: string
    amountTo: string
    addressFrom?: string
    limitSwapMemo?: string
  }
}

export const SwapLimitCancel = ({ isOpen, onOpenChange, mode, transaction }: SwapLimitCancelProps) => {
  const uSwap = getUSwap()
  const selectedAccount = useSelectedAccount()
  const [inboundAddresses, setInboundAddresses] = useState<InboundAddressesItem[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<Error | undefined>()
  const [pricePerUnit, setPricePerUnit] = useState<USwapNumber | undefined>()
  const [totalAmount, setTotalAmount] = useState<USwapNumber | undefined>()

  const { assetFrom, assetTo, amountFrom, amountTo, addressFrom, limitSwapMemo } = transaction

  const sellAmount = useMemo(() => new USwapNumber(amountFrom), [amountFrom])

  const currentPricePerUnit = useMemo(() => {
    if (sellAmount.eq(0)) return null
    return new USwapNumber(amountTo).div(sellAmount)
  }, [amountTo, sellAmount])

  useEffect(() => {
    if (isOpen && mode === 'modify' && currentPricePerUnit && !pricePerUnit) {
      setPricePerUnit(currentPricePerUnit)
      setTotalAmount(new USwapNumber(amountTo))
    }
  }, [isOpen, mode, currentPricePerUnit, pricePerUnit, amountTo])

  useEffect(() => {
    if (!isOpen) {
      setPricePerUnit(undefined)
      setTotalAmount(undefined)
      return
    }

    setLoading(true)
    setError(undefined)

    getInboundAddresses()
      .then(addresses => setInboundAddresses(addresses))
      .catch(() => setError(new Error('Failed to load inbound addresses')))
      .finally(() => setLoading(false))
  }, [isOpen])

  const inboundAddress = inboundAddresses.find(addr => addr.chain === assetFrom.chain)

  const addressMatch = !addressFrom || !selectedAccount || selectedAccount.address.toLowerCase() === addressFrom.toLowerCase()

  const differencePercent = useMemo(() => {
    if (!currentPricePerUnit || !pricePerUnit) return null
    if (pricePerUnit.eq(0) || currentPricePerUnit.eq(0)) return null
    return pricePerUnit.sub(currentPricePerUnit).div(currentPricePerUnit).mul(100)
  }, [currentPricePerUnit, pricePerUnit])

  const onPriceChange = (v: string) => {
    const price = new USwapNumber(v)
    setPricePerUnit(price)
    if (!sellAmount.eq(0)) {
      setTotalAmount(price.mul(sellAmount))
    }
  }

  const onTotalChange = (v: string) => {
    const total = new USwapNumber(v)
    setTotalAmount(total)
    if (!sellAmount.eq(0)) {
      setPricePerUnit(total.div(sellAmount))
    }
  }

  const newTargetBaseAmount = useMemo(() => {
    if (!totalAmount || totalAmount.eq(0)) return null
    return totalAmount.getBaseValue('string', 8)
  }, [totalAmount])

  const canSubmit =
    selectedAccount &&
    selectedAccount.network === assetFrom.chain &&
    addressMatch &&
    limitSwapMemo &&
    inboundAddress &&
    !inboundAddress.halted &&
    !inboundAddress.chain_trading_paused &&
    (mode === 'cancel' || (mode === 'modify' && newTargetBaseAmount))

  const onSubmit = async () => {
    if (!canSubmit || !inboundAddress?.address || !selectedAccount || !limitSwapMemo) return

    setSubmitting(true)
    setError(undefined)

    try {
      const memo =
        mode === 'cancel'
          ? createCancelLimitSwapMemo(limitSwapMemo, amountFrom, assetFrom, assetTo)
          : createModifyLimitSwapMemo(limitSwapMemo, amountFrom, assetFrom, assetTo, newTargetBaseAmount!)

      const dustThreshold = BigInt(inboundAddress.dust_threshold || '0')
      const minAmount = dustThreshold > 0n ? dustThreshold : 10000n
      const sendAmount = (minAmount * 2n).toString()
      const assetValue = AssetValue.from({
        chain: assetFrom.chain,
        value: sendAmount,
        fromBaseDecimal: 8
      })

      await uSwap.transfer({
        assetValue,
        recipient: inboundAddress.address,
        memo,
        feeOptionKey: FeeOption.Fast
      })

      toast.success(mode === 'cancel' ? 'Cancel transaction submitted' : 'Modify transaction submitted')
      onOpenChange(false)
    } catch (err: any) {
      console.error(`Failed to ${mode} limit swap:`, err)
      setError(new Error(err.message || `Failed to ${mode} limit swap`))
    } finally {
      setSubmitting(false)
    }
  }

  const renderWarnings = () => {
    const action = mode === 'cancel' ? 'cancel' : 'modify'
    const warnings: string[] = []

    if (!selectedAccount) {
      warnings.push(`Connect a ${chainLabel(assetFrom.chain)} wallet to ${action} this order`)
    } else if (selectedAccount.network !== assetFrom.chain) {
      warnings.push(`Switch to a ${chainLabel(assetFrom.chain)} wallet to ${action} this order`)
    } else if (addressFrom && selectedAccount.address.toLowerCase() !== addressFrom.toLowerCase()) {
      warnings.push(`Connected wallet does not match the address that placed this order`)
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

  const isModify = mode === 'modify'
  const title = isModify ? 'Modify Limit Order' : 'Cancel Limit Order'
  const buttonLabel = submitting ? (isModify ? 'Modifying...' : 'Cancelling...') : loading ? 'Loading...' : isModify ? 'Modify Order' : 'Cancel Order'

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-xl">
        <CredenzaHeader>
          <CredenzaTitle>{title}</CredenzaTitle>
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

              {isModify && (
                <div className="border-t p-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="text-thor-gray flex items-center text-xs font-medium">
                        <span>When 1</span>
                        {assetFrom && <img className="mx-1 h-4 w-4" src={assetFrom.logoURI} alt={assetFrom.ticker} />}
                        <span>{assetFrom.ticker} is worth</span>
                      </div>
                      <DecimalInput
                        className="text-leah w-full bg-transparent text-lg font-semibold outline-none"
                        amount={(pricePerUnit ?? currentPricePerUnit)?.toSignificant() ?? ''}
                        onAmountChange={onPriceChange}
                        autoComplete="off"
                      />
                      {differencePercent && !differencePercent.eq(0) && (
                        <div className="text-thor-gray text-xs font-medium">
                          {differencePercent.gte(0) ? '+' : ''}
                          {differencePercent.toFixed(1)}% from current
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 text-right">
                      <div className="text-thor-gray text-xs font-medium">You will get</div>
                      <DecimalInput
                        className="text-leah w-full bg-transparent text-right text-lg font-semibold outline-none"
                        amount={totalAmount?.toSignificant() ?? amountTo}
                        onAmountChange={onTotalChange}
                        autoComplete="off"
                      />
                      <div className="text-thor-gray text-xs font-medium">{assetTo.ticker}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-thor-gray text-sm">
              {isModify
                ? 'Modifying this limit order will update the target price. A small network fee will be charged to process the modification.'
                : 'Cancelling this limit order will return your deposited funds to your wallet. A small network fee will be charged to process the cancellation.'}
            </p>

            {renderWarnings()}

            {error && <SwapError error={error} />}
          </div>

          <div className="from-lawrence pointer-events-none absolute inset-x-0 -bottom-px h-4 bg-linear-to-t to-transparent" />
        </ScrollArea>

        <div className="p-4 pt-2 md:p-8 md:pt-2">
          <ThemeButton variant="primaryMedium" className="w-full" onClick={onSubmit} disabled={!canSubmit || submitting || loading}>
            {(submitting || loading) && <LoaderCircle size={20} className="animate-spin" />}
            <span>{buttonLabel}</span>
          </ThemeButton>
        </div>
      </CredenzaContent>
    </Credenza>
  )
}
