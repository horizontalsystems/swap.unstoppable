import { ThemeButton } from '@/components/theme-button'
import { ALL_CHAINS } from '@/components/connect-wallet/config'
import { DragEvent, useRef, useState } from 'react'
import { Icon } from '@/components/icons'
import { useWallets } from '@/hooks/use-wallets'
import { WalletOption } from '@swapkit/core'
import { LoaderCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { SwapError } from '@/components/swap/swap-error'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportKeystore({ onBack, onConnect }: { onBack: () => void; onConnect: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | undefined>()
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [password, setPassword] = useState<string | undefined>()
  const [error, setError] = useState<Error | undefined>()
  const [connecting, setConnecting] = useState(false)
  const { connect } = useWallets()

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    if (file) return
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    if (file) return
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    if (file) return
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer?.files?.[0])
  }

  const handleFile = (file: File) => {
    console.log(file.type)

    if (!['application/json', 'text/plain'].includes(file.type))
      return setError(new Error('Invalid file type. Please upload a JSON or TXT file.'))

    setError(undefined)
    setFile(file)
  }

  const decryptInWorker = (keystoreData: any, password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./decrypt-worker.ts', import.meta.url), { type: 'module' })

      worker.onmessage = e => {
        worker.terminate()
        if (e.data.success) {
          resolve(e.data.phrase)
        } else {
          reject(e.data.error)
        }
      }

      worker.onerror = error => {
        worker.terminate()
        reject(error)
      }

      worker.postMessage({ keystoreData, password })
    })
  }

  const onImport = async () => {
    if (!file || !password) return

    setError(undefined)
    setConnecting(true)

    file
      .text()
      .then(text => decryptInWorker(JSON.parse(text), password))
      .then(phrase =>
        connect(WalletOption.KEYSTORE, ALL_CHAINS, {
          phrase
        })
      )
      .then(onConnect)
      .catch(e => {
        setError(e)
        setConnecting(false)
      })
  }

  return (
    <>
      <div className="relative flex min-h-0 flex-1">
        <ScrollArea className="flex-1 px-4 md:px-8">
          <div className="mb-4 flex flex-col">
            <div className="mb-4 text-base font-semibold">Import Keystore</div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!file) fileInputRef.current?.click()
              }}
              className={cn(
                'border-blade flex h-40 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-8 text-center transition-all duration-200 ease-in-out',
                { 'hover:bg-blade/50 cursor-pointer': !file },
                { 'bg-blade/50': isDragging }
              )}
            >
              <Input
                ref={fileInputRef}
                type="file"
                accept=".txt,.json"
                hidden
                disabled={connecting}
                onChange={e => {
                  if (e.target.files?.[0]) handleFile(e.target.files?.[0])
                }}
              />

              {file ? (
                <div
                  className="bg-brand-first/10 border-brand-first text-leah hover:bg-lucian/10 hover:text-lucian hover:border-lucian flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 font-semibold"
                  onClick={() => {
                    setFile(undefined)
                  }}
                >
                  {file.name}
                  <Icon name="trash" className="size-5 shrink-0" />
                </div>
              ) : (
                <>
                  <Icon name="cloud-in" className="text-thor-gray size-12 shrink-0" />
                  <span className="text-leah text-sm font-semibold">
                    Select or drag your keystore file to upload it
                  </span>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <div className="text-thor-gray text-base font-semibold">Decryption Password</div>
              <Input
                type="password"
                placeholder="Password"
                onChange={e => setPassword(e.target.value)}
                disabled={connecting}
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
          disabled={connecting || !file || !password}
        >
          {connecting && <LoaderCircle size={20} className="animate-spin" />} Import
        </ThemeButton>
      </div>
    </>
  )
}
