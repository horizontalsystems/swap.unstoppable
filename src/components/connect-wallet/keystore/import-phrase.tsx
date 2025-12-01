import { ThemeButton } from '@/components/theme-button'
import { ALL_CHAINS } from '@/components/connect-wallet/config'
import { useState } from 'react'
import { useWallets } from '@/hooks/use-wallets'
import { WalletOption } from '@swapkit/core'
import { LoaderCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { mnemonicToSeedSync } from '@scure/bip39'
import { SwapError } from '@/components/swap/swap-error'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportPhrase({ onBack, onConnect }: { onBack: () => void; onConnect: () => void }) {
  const [phrase, setPhrase] = useState<string | undefined>()
  const [error, setError] = useState<Error | undefined>()
  const [connecting, setConnecting] = useState(false)
  const { connect } = useWallets()

  const onImport = async () => {
    try {
      setConnecting(true)

      // validate seed phrase
      mnemonicToSeedSync(phrase || '')

      await connect(WalletOption.KEYSTORE, ALL_CHAINS, { phrase })
      onConnect()
    } catch (e: any) {
      setError(e)
      setConnecting(false)
    }
  }

  return (
    <>
      <div className="relative flex min-h-0 flex-1">
        <ScrollArea className="flex-1 px-4 md:px-8">
          <div className="mb-4 flex flex-col">
            <div className="mb-4 text-base font-semibold">Import Seed Phrase</div>

            <div className="flex flex-col gap-2">
              <Textarea
                className="h-40"
                placeholder="Type your seed phrase"
                disabled={connecting}
                onChange={e => {
                  setPhrase(e.target.value)
                  setError(undefined)
                }}
              />
            </div>

            {error && (
              <div className="pt-4">
                <SwapError error={error} />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="from-lawrence pointer-events-none absolute inset-x-0 -bottom-[1px] h-4 bg-linear-to-t to-transparent" />
      </div>

      <div className="flex gap-3 p-4 pt-2 md:justify-end md:gap-6 md:px-8 md:pb-8">
        <ThemeButton variant="secondaryMedium" onClick={onBack}>
          Back
        </ThemeButton>

        <ThemeButton
          variant="primaryMedium"
          className="flex-1 md:flex-0"
          onClick={onImport}
          disabled={connecting || !phrase}
        >
          {connecting && <LoaderCircle size={20} className="animate-spin" />} Import
        </ThemeButton>
      </div>
    </>
  )
}
