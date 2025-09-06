import { LoaderCircle } from 'lucide-react'
import { InsufficientAllowanceError, MsgErc20IncreaseAllowance, networkLabel } from 'rujira.js'
import { useSwap } from '@/hooks/use-swap'
import { useAccounts } from '@/context/accounts-provider'
import { useQuote } from '@/hooks/use-quote'
import { useSimulation } from '@/hooks/use-simulation'
import { WalletConnectDialog } from '@/components/wallet-connect/wallet-connect-dialog'
import { useDialog } from '@/components/global-dialog'
import { cn } from '@/lib/utils'
import { wallets } from '@/wallets'
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
  const { selected, context } = useAccounts()
  const { fromAsset, fromAmount, destination, toAsset } = useSwap()
  const { isLoading: isQuoting, refetch: refetchQuote } = useQuote()
  const { isLoading: isSimulating, simulationData, error: simulationError } = useSimulation()
  const { openDialog } = useDialog()

  const getState = (): ButtonState => {
    if (!fromAsset || !toAsset) return { text: '', spinner: true, accent: false }
    if (!fromAmount) return { text: 'Enter Amount', spinner: false, accent: false }
    if (isQuoting || isSimulating) return { text: 'Quoting...', spinner: true, accent: false }
    if (!selected)
      return {
        text: `Connect ${networkLabel(fromAsset.chain)} Wallet`,
        spinner: false,
        accent: false,
        onClick: () => openDialog(WalletConnectDialog, {})
      }
    if (!destination)
      return {
        text: `Connect or Set ${networkLabel(toAsset.chain)} Wallet`,
        spinner: false,
        accent: false,
        onClick: () => openDialog(WalletConnectDialog, {})
      }
    if (simulationError instanceof InsufficientAllowanceError) {
      return {
        text: `Approve ${fromAsset.metadata.symbol}`,
        spinner: false,
        accent: false,
        onClick: async () => {
          const msg = new MsgErc20IncreaseAllowance(simulationError)
          const simulateFunc = wallets.simulate(context, selected)
          const promise = simulateFunc(msg)
            .then(simulation => {
              const broadcast = wallets.signAndBroadcast(context, selected)
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
    <button
      className={cn(
        'flex items-center justify-center gap-2',
        'text-lawrence disabled:text-andy mt-6 h-14 w-full rounded-4xl text-base font-semibold transition-colors disabled:opacity-100',
        {
          'bg-liquidity-green hover:bg-liquidity-green/90': state.accent,
          'bg-leah hover:bg-leah/90 disabled:bg-blade': !state.accent
        }
      )}
      onClick={state.onClick}
      disabled={!state.onClick}
    >
      {state.spinner && <LoaderCircle size={20} className="animate-spin" />}
      {state.text}
    </button>
  )
}
