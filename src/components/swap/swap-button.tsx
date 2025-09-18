import { LoaderCircle } from 'lucide-react'
import { InsufficientAllowanceError, MsgErc20IncreaseAllowance, networkLabel } from 'rujira.js'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { getSelectedContext, useAccounts } from '@/hooks/use-accounts'
import { useQuote } from '@/hooks/use-quote'
import { useSimulation } from '@/hooks/use-simulation'
import { WalletConnectDialog } from '@/components/header/wallet-connect-dialog'
import { ThemeButton } from '@/components/theme-button'
import { signAndBroadcast, simulate } from '@/wallets'
import { useBalance } from '@/hooks/use-balance'
import { useDialog } from '@/components/global-dialog'
import { toast } from 'sonner'

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
  const { selected } = useAccounts()
  const { amountFrom, destination } = useSwap()
  const { isLoading: isQuoting, refetch: refetchQuote } = useQuote()
  const { isLoading: isSimulating, simulationData, error: simulationError } = useSimulation()
  const { balance, isLoading: isBalanceLoading } = useBalance()

  const { openDialog } = useDialog()

  const getState = (): ButtonState => {
    if (!assetFrom || !assetTo) return { text: '', spinner: true, accent: false }
    if (!amountFrom) return { text: 'Enter Amount', spinner: false, accent: false }
    if (!isBalanceLoading && balance?.amount && balance.amount < amountFrom) {
      return {
        text: 'Insufficient balance',
        spinner: false,
        accent: false
      }
    }
    if (isQuoting || isSimulating) return { text: 'Quoting...', spinner: true, accent: false }
    if (!selected)
      return {
        text: `Connect ${networkLabel(assetFrom.chain)} Wallet`,
        spinner: false,
        accent: false,
        onClick: () => openDialog(WalletConnectDialog, {})
      }
    if (!destination)
      return {
        text: `Connect ${networkLabel(assetTo.chain)} Wallet`,
        spinner: false,
        accent: false,
        onClick: () => openDialog(WalletConnectDialog, {})
      }
    if (simulationError instanceof InsufficientAllowanceError) {
      return {
        text: `Approve ${assetFrom.metadata.symbol}`,
        spinner: false,
        accent: false,
        onClick: async () => {
          const msg = new MsgErc20IncreaseAllowance(simulationError)
          const context = getSelectedContext()

          if (!context) return

          const simulateFunc = simulate(context, selected)
          const promise = simulateFunc(msg)
            .then(simulation => {
              const broadcast = signAndBroadcast(context, selected)
              return broadcast(simulation, msg)
            })
            .then(res => {
              refetchQuote()
              return res
            })

          toast.promise(promise, {
            loading: 'Approval Transaction',
            success: 'Success',
            error: (err: any) => err.message || 'Error Submitting Transaction'
          })
        }
      }
    }
    if (!simulationData) return { text: 'No Valid Quotes', spinner: false, accent: false }
    return { text: 'Swap', spinner: false, accent: true, onClick: onSwap }
  }

  const state = getState()

  return (
    <ThemeButton
      variant={state.accent ? 'primaryMedium' : 'secondaryMedium'}
      className="w-full"
      onClick={state.onClick}
      disabled={!state.onClick}
    >
      {state.spinner && <LoaderCircle size={20} className="animate-spin" />}
      {state.text}
    </ThemeButton>
  )
}
