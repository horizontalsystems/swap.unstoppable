import { useEffect, useState } from 'react'

// `undefined` while the extension handshake is still running
export const useFreighterInstalled = (): boolean | undefined => {
  const [installed, setInstalled] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    let active = true
    import('@uswap/wallets/freighter')
      .then(({ isFreighterInstalled }) => isFreighterInstalled())
      .catch(() => false)
      .then(result => {
        if (active) setInstalled(result)
      })
    return () => {
      active = false
    }
  }, [])

  return installed
}
