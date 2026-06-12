import { EVMChain } from '@uswap/core'
import { LoaderCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { chainLabel } from '@/components/connect-wallet/config'
import { ConnectWallet } from '@/components/connect-wallet/connect-wallet'
import { useDialog } from '@/components/global-dialog'
import { InstantSwapDialog } from '@/components/swap/instant-swap-dialog'
import { SwapDialog } from '@/components/swap/swap-dialog'
import { ThemeButton } from '@/components/theme-button'
import { useBalance } from '@/hooks/use-balance'
import { useQuote } from '@/hooks/use-quote'
import { useSimulation } from '@/hooks/use-simulation'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { useSelectedAccount } from '@/hooks/use-wallets'
import { getUSwap } from '@/lib/wallets'
import { useIsLimitSwap } from '@/store/limit-swap-store'
import { QuoteResponseRoute } from '@/types'

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
  const t = useTranslations('swap.button')
  const tt = useTranslations('swap.toast')
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const uSwap = getUSwap()
  const selectedAccount = useSelectedAccount()
  const isLimitSwap = useIsLimitSwap()
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

    if (valueFrom.eqValue(0)) return { text: t('enterAmount'), spinner: false, accent: false }

    if (isQuoting || isSimulating) return { text: t('quoting'), spinner: true, accent: false }

    if (!quote) return { text: t('noValidQuotes'), spinner: false, accent: false }

    if (!selectedAccount) {
      if (instantSwapSupported) {
        if (!instantSwapAvailable) return { text: t('swap'), spinner: false, accent: false }

        return { text: t('swap'), spinner: false, accent: true, onClick: () => onInstantSwap(quote) }
      } else {
        return {
          text: t('connectWallet', { chain: chainLabel(assetFrom.chain) }),
          spinner: false,
          accent: false,
          onClick: () => openDialog(ConnectWallet, { chain: assetFrom.chain })
        }
      }
    }

    if (isBalanceLoading || !balance || balance.spendable.lt(valueFrom)) {
      return {
        text: t('insufficientBalance'),
        spinner: false,
        accent: false
      }
    }

    if (approveData) {
      return {
        text: t('approve', { ticker: assetFrom.ticker }),
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
            .then(() => {
              refetchQuote()
            })

          toast.promise(promise, {
            loading: tt('approvalTransaction'),
            success: tt('success'),
            error: (err: any) => err.message || tt('errorSubmitting')
          })
        }
      }
    }

    return {
      text: isLimitSwap ? t('placeLimitOrder') : t('swap'),
      spinner: false,
      accent: true,
      onClick: () => onSwap(quote)
    }
  }

  const state = getState()

  return (
    <ThemeButton
      variant={state.accent ? 'primaryMedium' : 'secondaryMedium'}
      className="my-3 w-full"
      onClick={state.onClick}
      disabled={!state.onClick}
    >
      {state.spinner && <LoaderCircle size={20} className="animate-spin" />}
      {state.text}
    </ThemeButton>
  )
}
