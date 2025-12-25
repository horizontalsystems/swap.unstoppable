'use client'

import { ThemeButton } from '@/components/theme-button'
import { WalletParams } from '@/components/connect-wallet/config'
import { useState } from 'react'
import { CreateWallet } from '@/components/connect-wallet/keystore/create-wallet'
import { ImportKeystore } from '@/components/connect-wallet/keystore/import-keystore'
import { ImportPhrase } from '@/components/connect-wallet/keystore/import-phrase'

export const Keystore = ({ onConnect }: { wallet: WalletParams; onConnect: () => void }) => {
  const [walletType, setWalletType] = useState<'create' | 'import_keystore' | 'import_phrase' | null>(null)

  const onBack = () => setWalletType(null)

  if (walletType === 'create') {
    return <CreateWallet onBack={onBack} onConnect={onConnect} />
  }

  if (walletType === 'import_keystore') {
    return <ImportKeystore onBack={onBack} onConnect={onConnect} />
  }

  if (walletType === 'import_phrase') {
    return <ImportPhrase onBack={onBack} onConnect={onConnect} />
  }

  return (
    <div className="mb-8 flex flex-1 flex-col items-center justify-center gap-3 px-8 md:mb-0 md:px-16">
      <ThemeButton className="w-full" variant="primaryMedium" onClick={() => setWalletType('import_keystore')}>
        Open Keystore
      </ThemeButton>
      <ThemeButton className="w-full" variant="secondaryMedium" onClick={() => setWalletType('create')}>
        Create New Wallet
      </ThemeButton>
      <ThemeButton className="w-full" variant="secondaryMedium" onClick={() => setWalletType('import_phrase')}>
        Import Seed Phrase
      </ThemeButton>
    </div>
  )
}
