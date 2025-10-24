import { ThemeButton } from '@/components/theme-button'
import { ALL_CHAINS, WalletParams } from '@/components/connect-wallet/config'
import { useMemo, useRef, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Icon } from '@/components/icons'
import { useWallets } from '@/hooks/use-wallets'
import { WalletOption } from '@swapkit/core'
import { decryptFromKeystore, encryptToKeyStore, generatePhrase } from '@swapkit/wallets/keystore'
import { LoaderCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '../ui/separator'
import { cn } from '@/lib/utils'

export const Keystore = ({ onConnect }: { wallet: WalletParams; onConnect: () => void }) => {
  const [walletType, setWalletType] = useState<'create' | 'import' | null>(null)

  const onBack = () => setWalletType(null)

  if (walletType === 'create') {
    return <CreateWallet onBack={onBack} onConnect={onConnect} />
  }
  if (walletType === 'import') {
    return <ImportWallet onBack={onBack} onConnect={onConnect} />
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="px-8">
        <div className="text-leah mb-3 text-base font-semibold">Add Wallet</div>
        <p className="text-thor-gray mb-5 text-sm">
          You may load wallet or import wallet from a Seed phrase, or create a new wallet
        </p>
      </div>

      <div className="grid w-full px-8">
        <ThemeButton className="w-full" variant="primaryMedium" onClick={() => setWalletType('create')}>
          Create New Wallet
        </ThemeButton>
        <div className="relative flex items-center justify-center overflow-hidden py-3">
          <Separator />
          <span className="mx-1 px-2 text-sm">or</span>
          <Separator />
        </div>
        <ThemeButton className="w-full" variant="secondaryMedium" onClick={() => setWalletType('import')}>
          Import File
        </ThemeButton>
      </div>
    </div>
  )
}

function CreateWallet({ onBack, onConnect }: { onBack: () => void; onConnect: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [phrase] = useState(generatePhrase(12))
  const { connect } = useWallets()

  const seedWords = useMemo(() => phrase.split(' '), [phrase])

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
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-8">
        <div className="text-leah mb-3 text-base font-semibold">Seed Phrases</div>

        <p className="text-thor-gray mb-5 text-sm">
          Write these 12 words down and store them securely offline. This 12 word phrase is used to recover your wallet
          private keys.
        </p>

        <div className="flex flex-col items-center gap-6 rounded-2xl bg-black p-8 pb-4">
          <div className="flex flex-wrap justify-center gap-2">
            {seedWords.map((word, index) => (
              <div key={index} className="flex items-center gap-1 p-2">
                <span className="text-gray text-sm">{index + 1}</span>
                <span className="text-sm text-white">{word}</span>
              </div>
            ))}
          </div>

          <ThemeButton variant="secondarySmall">Copy Phrase</ThemeButton>
        </div>
      </div>

      <div className="flex gap-6 p-4 md:justify-end md:px-8 md:pt-0 md:pb-8">
        <ThemeButton variant="secondaryMedium" onClick={onBack}>
          Back
        </ThemeButton>
        <ThemeButton
          variant="primaryMedium"
          className="flex-1 md:flex-0"
          disabled={connecting}
          onClick={() => setShowPassword(true)}
        >
          {connecting && <LoaderCircle size={20} className="animate-spin" />} Create
        </ThemeButton>
      </div>
    </div>
  )
}

function SetupPassword({
  onBack,
  onSetup,
  connecting
}: {
  onBack: () => void
  onSetup: (p: string) => void
  connecting: boolean
}) {
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-8">
        <div className="text-leah mb-3 text-base font-semibold">Create a New Password</div>
        <p className="text-thor-gray mb-5 text-sm">
          Enter a strong password to encrypt your imported wallet. This is how you will access your wallet.
        </p>

        <div className="space-y-4">
          <Input
            placeholder="Enter Password"
            type="password"
            onChange={e => setPassword1(e.target.value)}
            className={cn(
              'text-leah placeholder:text-andy border-blade focus-visible:border-blade rounded-xl border-1 p-4 text-base focus:ring-0 focus-visible:ring-0'
            )}
          />
          <div>
            <Input
              placeholder="Confirm Password"
              type="password"
              onChange={e => setPassword2(e.target.value)}
              className={cn(
                'text-leah placeholder:text-andy border-blade focus-visible:border-blade none rounded-xl border-1 p-4 text-base focus:ring-0 focus-visible:ring-0',
                {
                  'border-lucian focus-visible:border-lucian': password2 && password1 !== password2
                }
              )}
            />
            {password2 && password1 !== password2 && <span className="text-lucian text-xs">Password must match</span>}
          </div>
        </div>
      </div>

      <div className="flex gap-6 p-4 md:justify-end md:px-8 md:pt-0 md:pb-8">
        <ThemeButton variant="secondaryMedium" onClick={onBack}>
          Back
        </ThemeButton>
        <ThemeButton
          variant="primaryMedium"
          className="flex-1 md:flex-0"
          disabled={!password1.length || !password2.length || password1 !== password2 || connecting}
          onClick={() => onSetup(password1)}
        >
          {connecting && <LoaderCircle size={20} className="animate-spin" />} Connect
        </ThemeButton>
      </div>
    </div>
  )
}

function ImportWallet({ onBack, onConnect }: { onBack: () => void; onConnect: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | undefined>()
  const [phrase, setPhrase] = useState<string | undefined>()
  const [password, setPassword] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [connecting, setConnecting] = useState(false)
  const { connect } = useWallets()

  const onNext = async () => {
    if (phrase) {
      try {
        setConnecting(true)
        await connect(WalletOption.KEYSTORE, ALL_CHAINS, { phrase })
        onConnect()
      } catch (e: any) {
        setError(e.message)
        setConnecting(false)
      }
      return
    }

    if (!file) return setError('Keystore file is required')
    if (!password) return setError('Password is required')

    try {
      setError(undefined)
      setConnecting(true)

      await connect(WalletOption.KEYSTORE, ALL_CHAINS, {
        phrase: await decryptFromKeystore(JSON.parse(await file.text()), password)
      })
      onConnect()
    } catch (e: any) {
      setError(e.message)
      setConnecting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-8">
        <div className="mb-4 text-xl font-bold">Import Wallet</div>

        <p className="text-thor-gray mb-4 text-sm">
          Import wallet using your Secret Recovery Phrase or by loading your keystore file.
        </p>

        <div className="flex flex-col gap-2">
          <Textarea
            className="border-blade h-35 text-center"
            placeholder={file?.name || 'Type your phrase here.'}
            disabled={!!file || connecting}
            onChange={e => setPhrase(e.target.value)}
          />
          <Input
            ref={fileRef}
            type="file"
            accept=".txt,.json"
            hidden
            disabled={connecting}
            onChange={e => {
              setFile(e.target.files?.[0])
            }}
          />
          <ThemeButton variant="secondarySmall" onClick={() => fileRef.current?.click()} disabled={connecting}>
            Upload keystore file
          </ThemeButton>
        </div>
        {file && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="text-sm">Decryption Password</div>
            <Input
              type="password"
              placeholder="Password"
              onChange={e => setPassword(e.target.value)}
              disabled={connecting}
              className={cn(
                'text-leah placeholder:text-andy border-blade focus-visible:border-blade rounded-xl border-1 p-4 text-base focus:ring-0 focus-visible:ring-0'
              )}
            />
          </div>
        )}

        {error && (
          <Alert className="border-lucian mt-4 flex border-1">
            <div className="flex items-center gap-3">
              <Icon name="warning" className="text-lucian size-6 shrink-0" />
              <span className="text-lucian text-xs">{error}</span>
            </div>
          </Alert>
        )}
      </div>

      <div className="flex gap-6 p-4 md:justify-end md:px-8 md:pt-0 md:pb-8">
        <ThemeButton variant="secondaryMedium" onClick={onBack}>
          Back
        </ThemeButton>

        <ThemeButton variant="primaryMedium" onClick={onNext} disabled={connecting}>
          {connecting && <LoaderCircle size={20} className="animate-spin" />} Next
        </ThemeButton>
      </div>
    </div>
  )
}
