import { ThemeButton } from '@/components/theme-button'
import { ALL_CHAINS, WalletParams } from '@/components/connect-wallet/config'
import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Icon } from '@/components/icons'
import { useWallets } from '@/hooks/use-wallets'
import { WalletOption } from '@swapkit/core'
import { decryptFromKeystore, encryptToKeyStore, generatePhrase } from '@swapkit/wallets/keystore'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CopyButton } from '@/components/button-copy'

export const Keystore = ({ onConnect }: { wallet: WalletParams; onConnect: () => void }) => {
  const [walletType, setWalletType] = useState<'new' | 'import' | null>(null)

  const onBack = () => setWalletType(null)

  if (walletType === 'new') {
    return <NewWallet onBack={onBack} onConnect={onConnect} />
  }
  if (walletType === 'import') {
    return <ImportWallet onBack={onBack} onConnect={onConnect} />
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col gap-2">
        <ThemeButton variant="primarySmall" onClick={() => setWalletType('new')}>
          Create a new wallet
        </ThemeButton>
        <ThemeButton variant="primarySmall" onClick={() => setWalletType('import')}>
          Import existing
        </ThemeButton>
      </div>
    </div>
  )
}

function NewWallet({ onBack, onConnect }: { onBack: () => void; onConnect: () => void }) {
  const [showWords, setShowWords] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [phrase] = useState(generatePhrase(12))
  const { connect } = useWallets()

  const words = useMemo(() => phrase.split(' '), [phrase])

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
        <div className="mb-4 text-xl font-bold">Your Secret Recovery Phrase</div>

        <p className="text-gray mb-4">
          Write these 12 words down and store them securely offline. This 12 word phrase is used to recover your wallet
          private keys.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="bg-leah flex items-center gap-1 rounded-xl p-2">
              <span className="text-sm text-white">{index + 1}</span>
              <span className="text-sm text-white">{showWords ? words[index] : '• • • • • •'}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 pt-3">
          <Button variant="link" className="underline" onClick={() => setShowWords(!showWords)}>
            <EyeOffIcon className="text-muted-foreground h-5 w-5" /> Show
          </Button>
          <Button variant="link" className="underline">
            <CopyButton text={phrase} /> Copy
          </Button>
        </div>
      </div>

      <div className="flex gap-2 p-4 md:justify-end md:px-8 md:pt-0 md:pb-8">
        <ThemeButton variant="primarySmall" onClick={onBack}>
          Back
        </ThemeButton>

        <ThemeButton variant="primarySmall" onClick={() => setShowPassword(true)}>
          Next
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
  onSetup: (pwd: string) => void
  connecting: boolean
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-8">
        <h1 className="mb-4 text-xl font-bold">Create a New Password</h1>
        <p className="text-gray mb-4">
          Enter a strong password to encrypt your imported wallet. This is how you will access your wallet.
        </p>

        <Alert className="my-4 flex">
          <div className="flex items-center gap-3">
            <Icon name="warning" className="text-jacob size-6 shrink-0" />
            <span className="text-jacob text-xs">Note: If you forget your password, you can’t recover it.</span>
          </div>
        </Alert>

        <div className="space-y-4">
          <div className="focus-within:ring-ring relative flex items-center rounded-md border pe-2 focus-within:ring-1">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter Password"
              value={password1}
              onChange={e => setPassword1(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
              disabled={connecting}
            />
            <button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOffIcon className="text-muted-foreground h-5 w-5" />
              ) : (
                <EyeIcon className="text-muted-foreground h-5 w-5" />
              )}
            </button>
          </div>
          <div className="focus-within:ring-ring relative flex items-center rounded-md border pe-2 focus-within:ring-1">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
              disabled={connecting}
            />
            <button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOffIcon className="text-muted-foreground h-5 w-5" />
              ) : (
                <EyeIcon className="text-muted-foreground h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-4 md:justify-end md:px-8 md:pt-0 md:pb-8">
        <ThemeButton variant="primarySmall" onClick={onBack} disabled={connecting}>
          Back
        </ThemeButton>
        <ThemeButton
          variant="primarySmall"
          disabled={!password1.length || !password2.length || password1 !== password2 || connecting}
          onClick={() => onSetup(password1)}
        >
          {password1 !== password2 ? 'Password must match' : 'Connect'}
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

        <p className="text-gray mb-4">
          Import wallet using your Secret Recovery Phrase or by loading your keystore file.
        </p>

        <div className="flex flex-col gap-2">
          <Textarea
            className="text-center"
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
          <Button onClick={() => fileRef.current?.click()} disabled={connecting}>
            Upload keystore file
          </Button>
        </div>
        {file && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="text-sm">Decryption Password</div>
            <Input
              type="password"
              placeholder="Password"
              onChange={e => setPassword(e.target.value)}
              disabled={connecting}
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

      <div className="flex gap-2 p-4 md:justify-end md:px-8 md:pt-0 md:pb-8">
        <ThemeButton variant="primarySmall" onClick={onBack}>
          Back
        </ThemeButton>

        <ThemeButton variant="primarySmall" onClick={onNext} disabled={connecting}>
          Next
        </ThemeButton>
      </div>
    </div>
  )
}
