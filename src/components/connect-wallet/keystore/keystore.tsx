'use client'

import { useState } from 'react'
import { Chain } from '@uswap/core'
import { useTranslations } from 'next-intl'
import { ChainSelect } from '@/components/connect-wallet/chain-select'
import { ALL_CHAINS, WalletParams } from '@/components/connect-wallet/config'
import { CreateWallet } from '@/components/connect-wallet/keystore/create-wallet'
import { ImportKeystore } from '@/components/connect-wallet/keystore/import-keystore'
import { ImportPhrase } from '@/components/connect-wallet/keystore/import-phrase'
import { ThemeButton } from '@/components/theme-button'

export const Keystore = ({ wallet, chains, onConnect }: { wallet: WalletParams; chains: (Chain | string)[]; onConnect: () => void }) => {
  const t = useTranslations('wallet')
  const availableChains = chains.filter(c => ALL_CHAINS.includes(c as Chain) && wallet.supportedChains.includes(c as Chain)) as Chain[]

  const [walletType, setWalletType] = useState<'create' | 'import_keystore' | 'import_phrase' | null>(null)
  const [selectedChains, setSelectedChains] = useState<Chain[]>(availableChains)

  const onBack = () => setWalletType(null)

  if (walletType === 'create') {
    return <CreateWallet chains={selectedChains} onBack={onBack} onConnect={onConnect} />
  }

  if (walletType === 'import_keystore') {
    return <ImportKeystore chains={selectedChains} onBack={onBack} onConnect={onConnect} />
  }

  if (walletType === 'import_phrase') {
    return <ImportPhrase chains={selectedChains} onBack={onBack} onConnect={onConnect} />
  }

  const noChains = selectedChains.length === 0

  return (
    <>
      <ChainSelect chains={availableChains} selectedChains={selectedChains} onChange={c => setSelectedChains(c as Chain[])} />

      <div className="flex flex-col gap-3 p-4 pt-2 md:px-8 md:pb-8">
        <ThemeButton className="w-full" variant="primaryMedium" disabled={noChains} onClick={() => setWalletType('import_keystore')}>
          {t('openKeystore')}
        </ThemeButton>
        <div className="grid grid-cols-2 gap-3">
          <ThemeButton
            className="w-full min-w-0 px-4 leading-tight whitespace-normal"
            variant="secondaryMedium"
            disabled={noChains}
            onClick={() => setWalletType('import_phrase')}
          >
            {t('importSeedPhrase')}
          </ThemeButton>
          <ThemeButton
            className="w-full min-w-0 px-4 leading-tight whitespace-normal"
            variant="secondaryMedium"
            disabled={noChains}
            onClick={() => setWalletType('create')}
          >
            {t('createNewWallet')}
          </ThemeButton>
        </div>
      </div>
    </>
  )
}
