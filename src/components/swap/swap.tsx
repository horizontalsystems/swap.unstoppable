'use client'

import { SwapAddressFrom } from '@/components/swap/swap-address-from'
import { SwapAddressTo } from '@/components/swap/swap-address-to'
import { SwapSettings } from '@/components/swap/swap-settings'
import { SwapInputFrom } from '@/components/swap/swap-input-from'
import { SwapInputTo } from '@/components/swap/swap-input-to'
import { SwapToggleAssets } from '@/components/swap/swap-toggle-assets'
import { SwapError } from '@/components/swap/swap-error'
import { SwapDetails } from '@/components/swap/swap-details'
import { SwapButton } from '@/components/swap/swap-button'
import { SwapBetaAlert } from '@/components/swap/swap-beta-alert'
import { useQuote } from '@/hooks/use-quote'
import { useDialog } from '@/components/global-dialog'
import { SwapConfirm } from '@/components/swap/swap-confirm'

export const Swap = () => {
  const { error: quoteError } = useQuote()
  const { openDialog } = useDialog()

  return (
    <div className="flex flex-col items-center justify-center px-4 pb-4 md:pb-20">
      <div className="w-full max-w-md">
        <SwapBetaAlert />

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

        <SwapError error={quoteError} />
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
