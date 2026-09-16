import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useSelectedAccount } from '@/hooks/use-wallets'
import { recoverMediators } from '@/lib/stellar/mediator'

/**
 * Bring back funds from StellarBroker mediator accounts that an earlier session never merged —
 * the page was closed mid-swap, or the merge itself failed.
 *
 * Runs whenever a Stellar account becomes the selected one and whenever the tab comes back into
 * view, since a stranded mediator is most often left by a tab the user walked away from. It needs
 * no wallet prompt: the persisted secret signs the merge. Nothing happens when there is nothing
 * to recover, which is every visit but the rare one.
 */
export const useMediatorRecovery = (): void => {
  const t = useTranslations('swap.toast')
  const selectedAccount = useSelectedAccount()
  const address = selectedAccount?.network === 'XLM' ? selectedAccount.address : undefined

  useEffect(() => {
    if (!address) return
    let cancelled = false

    const run = () => {
      recoverMediators(address).then(results => {
        if (cancelled) return
        if (results.some(r => r.hash)) toast.success(t('mediatorRecovered'))
      })
    }

    run()
    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
    // `t` is stable for a locale; re-running on its identity would re-fire recovery on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])
}
