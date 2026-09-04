import { useEffect, useState } from 'react'
import { detectFreighter } from '@/lib/stellar/wallet'

/**
 * Whether Freighter is installed. `undefined` while the check is still running.
 *
 * Detection is a `postMessage` round-trip to the extension, not a global-variable read, so it
 * cannot be answered during render — hence the state. Everything else in the wallet list is a
 * synchronous `window.*` check, so this is the one entry that needs it.
 */
export const useFreighterInstalled = (): boolean | undefined => {
  const [installed, setInstalled] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    let active = true
    detectFreighter().then(result => {
      if (active) setInstalled(result)
    })
    return () => {
      active = false
    }
  }, [])

  return installed
}
