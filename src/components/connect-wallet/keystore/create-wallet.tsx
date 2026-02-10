import { useMemo, useState } from 'react'
import { WalletOption } from '@uswap/core'
import { encryptToKeyStore, generatePhrase } from '@uswap/wallets/keystore'
import { LoaderCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ALL_CHAINS } from '@/components/connect-wallet/config'
import { Icon } from '@/components/icons'
import { ThemeButton } from '@/components/theme-button'
import { useWallets } from '@/hooks/use-wallets'
import { cn } from '@/lib/utils'

export function CreateWallet({ onBack, onConnect }: { onBack: () => void; onConnect: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [phrase] = useState(generatePhrase(12))
  const { connect } = useWallets()

  const seedWords = useMemo(() => phrase.split(' '), [phrase])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phrase)
    } catch (err) {
      console.log('Failed to copy text: ', err)
    }
  }

  const onSetup = async (password: string) => {
    try {
      setConnecting(true)
      const file = await encryptToKeyStore(phrase, password)
      const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.setAttribute('download', 'sto-keystore.json')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      await connect(WalletOption.KEYSTORE, ALL_CHAINS, {
        phrase
      })
      onConnect()
    } catch (e: any) {
      console.log(e.message)
      setConnecting(false)
    }
  }

  if (showPassword) {
    return <SetupPassword onBack={() => setShowPassword(false)} onSetup={p => onSetup(p)} connecting={connecting} />
  }

  return (
    <>
      <div className="relative flex min-h-0 flex-1">
        <ScrollArea className="flex-1 px-4 md:px-8">
          <div className="flex flex-col">
            <div className="text-leah mb-3 text-base font-semibold">Create New Wallet</div>

            <p className="text-thor-gray mb-5 text-sm">
              Write these 12 words down and store them securely offline. This 12 word phrase is used to recover your wallet private keys.
            </p>

            <div className="mb-2 flex flex-col items-center gap-6 rounded-xl bg-black p-4 pb-4">
              <div className="grid w-full grid-cols-3">
                {seedWords.map((word, index) => (
                  <div key={index} className="flex items-center gap-1 p-2 text-sm font-semibold">
                    <span className="text-gray">{index + 1}</span>
                    <span className="text-white">{word}</span>
                  </div>
                ))}
              </div>

              <ThemeButton variant="secondarySmall" onClick={handleCopy}>
                Copy Phrase
              </ThemeButton>
            </div>

            <div className="flex cursor-pointer items-center gap-4 py-4" onClick={() => setAccepted(!accepted)}>
              {accepted ? (
                <Icon name="check" className="text-lawrence bg-brand-second size-6 shrink-0 rounded-full p-1" />
              ) : (
                <div className="bg-blade size-6 shrink-0 rounded-full" />
              )}

              <span className="text-thor-gray text-sm">I confirm I have securely saved the passphrase to recover my account in the future.</span>
            </div>
          </div>
        </ScrollArea>

        <div className="from-lawrence pointer-events-none absolute inset-x-0 -bottom-[1px] h-4 bg-linear-to-t to-transparent" />
      </div>

      <div className="flex gap-6 p-4 pt-2 md:justify-end md:px-8 md:pb-8">
        <ThemeButton variant="secondaryMedium" onClick={onBack}>
          Back
        </ThemeButton>
        <ThemeButton variant="primaryMedium" className="flex-1 md:flex-0" disabled={connecting || !accepted} onClick={() => setShowPassword(true)}>
          {connecting && <LoaderCircle size={20} className="animate-spin" />} Next
        </ThemeButton>
      </div>
    </>
  )
}

export function SetupPassword({ onBack, onSetup, connecting }: { onBack: () => void; onSetup: (p: string) => void; connecting: boolean }) {
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')

  return (
    <>
      <div className="relative flex min-h-0 flex-1">
        <ScrollArea className="flex-1 px-4 md:px-8">
          <div className="mb-4 flex flex-col">
            <div className="text-leah mb-3 text-base font-semibold">Setup Decryption Password</div>
            <p className="text-thor-gray mb-5 text-sm">
              Enter a strong password to encrypt your created wallet. This is how you will access your wallet.
            </p>

            <div className="space-y-4">
              <Input placeholder="Enter Password" type="password" onChange={e => setPassword1(e.target.value)} />
              <div>
                <Input
                  placeholder="Confirm Password"
                  type="password"
                  onChange={e => setPassword2(e.target.value)}
                  className={cn({
                    'border-lucian focus-visible:border-lucian': password2 && password1 !== password2
                  })}
                />
                {password2 && password1 !== password2 && <span className="text-lucian text-xs">Password must match</span>}
              </div>
            </div>
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
          disabled={!password1.length || !password2.length || password1 !== password2 || connecting}
          onClick={() => onSetup(password1)}
        >
          {connecting && <LoaderCircle size={20} className="animate-spin" />} Create
        </ThemeButton>
      </div>
    </>
  )
}
