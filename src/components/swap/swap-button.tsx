import { LoaderCircle } from 'lucide-react'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { useWallets } from '@/hooks/use-wallets'
import { useQuote } from '@/hooks/use-quote'
import { useSimulation } from '@/hooks/use-simulation'
import { ConnectWallet } from '@/components/connect-wallet/connect-wallet'
import { ThemeButton } from '@/components/theme-button'
import { useBalance } from '@/hooks/use-balance'
import { useDialog } from '@/components/global-dialog'
import { toast } from 'sonner'
import { getSwapKit } from '@/lib/wallets'
import { EVMChain } from '@swapkit/core'
import { chainLabel } from '@/components/connect-wallet/config'

interface SwapButtonProps {
  onSwap: () => void
}

interface ButtonState {
  text: string
  spinner: boolean
  accent: boolean
  onClick?: () => void
}

export const SwapButton = ({ onSwap }: SwapButtonProps) => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const swapKit = getSwapKit()
  const { selected } = useWallets()
  const { valueFrom, destination } = useSwap()
  const { quote, isLoading: isQuoting, refetch: refetchQuote } = useQuote()
  const { isLoading: isSimulating, approveData } = useSimulation()
  const { balance, isLoading: isBalanceLoading } = useBalance()

  const { openDialog } = useDialog()

  const getState = (): ButtonState => {
    if (!assetFrom || !assetTo) return { text: '', spinner: true, accent: false }
    if (valueFrom.eqValue(0)) return { text: 'Enter Amount', spinner: false, accent: false }
    if (isQuoting || isSimulating) return { text: 'Quoting...', spinner: true, accent: false }
    if (!selected)
      return {
        text: `Connect ${chainLabel(assetFrom.chain)} Wallet`,
        spinner: false,
        accent: false,
        onClick: () => openDialog(ConnectWallet, { chain: assetFrom.chain })
      }
    if (!destination)
      return {
        text: `Connect ${chainLabel(assetTo.chain)} Wallet`,
        spinner: false,
        accent: false,
        onClick: () => openDialog(ConnectWallet, { chain: assetTo.chain })
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
          const wallet = swapKit.getWallet<EVMChain>(selected.provider, selected.network as EVMChain)
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
    return { text: 'Swap', spinner: false, accent: true, onClick: quote && onSwap }
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
