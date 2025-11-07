'use client'

import { SwapAddressFrom } from '@/components/swap/swap-address-from'
import { SwapAddressTo } from '@/components/swap/swap-address-to'
import { SwapSettings } from '@/components/swap/swap-settings'
import { SwapInputFrom } from '@/components/swap/swap-input-from'
import { SwapInputTo } from '@/components/swap/swap-input-to'
import { SwapToggleAssets } from '@/components/swap/swap-toggle-assets'
import { SwapDetails } from '@/components/swap/swap-details'
import { SwapButton } from '@/components/swap/swap-button'
import { useQuote } from '@/hooks/use-quote'
import { useDialog } from '@/components/global-dialog'
import { SwapConfirm } from '@/components/swap/swap-confirm'
import { useResolveSource } from '@/hooks/use-resolve-source'
import { useResolveDestination } from '@/hooks/use-resolve-destination'

export const Swap = () => {
  const { error: quoteError } = useQuote()
  const { openDialog } = useDialog()

  useResolveSource()
  useResolveDestination()

  return (
    <div className="flex flex-col items-center justify-center px-4 pt-4 pb-4 md:pb-20">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-leah text-2xl font-medium">Swap</h1>
          </div>
          <SwapSettings />
        </div>

        <div className="bg-lawrence border-blade rounded-3xl border-1">
          <SwapAddressFrom />
          <SwapInputFrom />
          <SwapToggleAssets />
          <SwapInputTo />
          <SwapAddressTo />
        </div>

        {/*<div className="px-4">*/}
        {/*  <SwapError error={quoteError} />*/}
        {/*</div>*/}

        <SwapButton
          onSwap={() => {
            openDialog(SwapConfirm, {})
          }}
        />
        <SwapDetails />
      </div>
    </div>
  )
}
