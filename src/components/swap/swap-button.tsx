import { LoaderCircle } from 'lucide-react'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { useSelectedAccount } from '@/hooks/use-wallets'
import { useQuote } from '@/hooks/use-quote'
import { useSimulation } from '@/hooks/use-simulation'
import { ConnectWallet } from '@/components/connect-wallet/connect-wallet'
import { ThemeButton } from '@/components/theme-button'
import { useBalance } from '@/hooks/use-balance'
import { useDialog } from '@/components/global-dialog'
import { toast } from 'sonner'
import { getUSwap } from '@/lib/wallets'
import { EVMChain } from '@uswap/core'
import { chainLabel } from '@/components/connect-wallet/config'
import { SwapDialog } from '@/components/swap/swap-dialog'
import { InstantSwapDialog } from '@/components/swap/instant-swap-dialog'
import { QuoteResponseRoute } from '@uswap/helpers/api'

interface SwapButtonProps {
  instantSwapSupported: boolean
  instantSwapAvailable: boolean
}

interface ButtonState {
  text: string
  spinner: boolean
  accent: boolean
  onClick?: () => void
}

export const SwapButton = ({ instantSwapSupported, instantSwapAvailable }: SwapButtonProps) => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const uSwap = getUSwap()
  const selectedAccount = useSelectedAccount()
  const { valueFrom } = useSwap()
  const { quote, isLoading: isQuoting, refetch: refetchQuote } = useQuote()
  const { isLoading: isSimulating, approveData } = useSimulation()
  const { balance, isLoading: isBalanceLoading } = useBalance()

  const { openDialog } = useDialog()

  const onSwap = (quote: QuoteResponseRoute) => {
    openDialog(SwapDialog, { provider: quote.providers[0] })
  }

  const onInstantSwap = (quote: QuoteResponseRoute) => {
    openDialog(InstantSwapDialog, { provider: quote.providers[0] })
  }

  const getState = (): ButtonState => {
    if (!assetFrom || !assetTo) return { text: '', spinner: true, accent: false }

    if (valueFrom.eqValue(0)) return { text: 'Enter Amount', spinner: false, accent: false }

    if (isQuoting || isSimulating) return { text: 'Quoting...', spinner: true, accent: false }

    if (!quote) return { text: 'No Valid Quotes', spinner: false, accent: false }

    if (!selectedAccount) {
      if (instantSwapSupported) {
        if (!instantSwapAvailable) return { text: 'Swap', spinner: false, accent: false }

        return { text: 'Swap', spinner: false, accent: true, onClick: () => onInstantSwap(quote) }
      } else {
        return {
          text: `Connect ${chainLabel(assetFrom.chain)} Wallet`,
          spinner: false,
          accent: false,
          onClick: () => openDialog(ConnectWallet, { chain: assetFrom.chain })
        }
      }
    }

    if (isBalanceLoading || !balance || balance.spendable.lt(valueFrom)) {
      return {
        text: 'Insufficient Balance',
        spinner: false,
        accent: false
      }
    }

    if (approveData) {
      return {
        text: `Approve ${assetFrom.ticker}`,
        spinner: false,
        accent: false,
        onClick: async () => {
          const wallet = uSwap.getWallet<EVMChain>(selectedAccount.provider, selectedAccount.network as EVMChain)
          if (!wallet) return
          const promise = wallet
            .approve({
              assetAddress: approveData.contract,
              spenderAddress: approveData.spender,
              amount: approveData.amount
            })
            .then(res => {
              console.log({ res })
              refetchQuote()
            })

          toast.promise(promise, {
            loading: 'Approval Transaction',
            success: 'Success',
            error: (err: any) => err.message || 'Error Submitting Transaction'
          })
        }
      }
    }

    return { text: 'Swap', spinner: false, accent: true, onClick: () => onSwap(quote) }
  }

  const state = getState()

  return (
    <ThemeButton
      variant={state.accent ? 'primaryMedium' : 'secondaryMedium'}
      className="mt-3 w-full"
      onClick={state.onClick}
      disabled={!state.onClick}
    >
      {state.spinner && <LoaderCircle size={20} className="animate-spin" />}
      {state.text}
    </ThemeButton>
  )
}
