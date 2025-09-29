import { ThemeButton } from '@/components/theme-button'
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle
} from '@/components/ui/credenza'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Network, networkLabel } from 'rujira.js'
import { useMemo, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import Image from 'next/image'
import { useAccounts } from '@/hooks/use-accounts'

type LedgerConfigProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const WalletConnectLedger = ({ isOpen, onOpenChange }: LedgerConfigProps) => {
  const { connect } = useAccounts()
  const [connecting, setConnecting] = useState(false)
  const [index, setIndex] = useState(0)

  const networks = [Network.Bitcoin, Network.Litecoin, Network.BitcoinCash, Network.Thorchain, 'EMVs']
  const [chain, setChain] = useState<string>(Network.Bitcoin)
  const [path, setPath] = useState<string | undefined>()

  const bitcoin = useMemo(
    () => ({
      "Native Segwit (m/84'/0'/0'/0'/{index})": [84, 0, 0, 0, index],
      "Native Segwit (m/84'/0'/{index}'/0/0)": [84, 0, index, 0, 0],
      "Taproot Native Segwit (m/86'/0'/0'/0'/{index})": [86, 0, 0, 0, index]
    }),
    [index]
  )

  const evms = useMemo(
    () => ({
      "Metamask (m/44'/60'/0'/0/{index})": [44, 60, 0, 0, index],
      "Ledger Live (m/44'/60'/{index}'/0/0/)": [44, 60, index, 0, 0],
      "Legacy (m/44'/60'/0'/{index})": [44, 60, 0, index]
    }),
    [index]
  )
  const thorchain = useMemo(
    () => ({
      "Default (m/44'/931'/0'/0/{index})": [44, 931, 0, 0, index]
    }),
    [index]
  )

  const pathOptions = useMemo(() => {
    if (chain === Network.Bitcoin) return Object.keys(bitcoin)
    if (chain === 'EMVs') return Object.keys(evms)
    if (chain === Network.Thorchain) return Object.keys(thorchain)
    return null
  }, [bitcoin, chain, evms, thorchain])

  const onConnect = async () => {
    const paths: Record<string, number[]> = { ...bitcoin, ...evms, ...thorchain }
    const config = {
      networks: chain === 'EMVs' ? [Network.Ethereum, Network.Bsc, Network.Base, Network.Avalanche] : [chain],
      derivationPath: path ? paths[path] : undefined
    }

    setConnecting(true)
    connect('Ledger', config)
      .then(() => {
        onOpenChange(false)
      })
      .catch(err => {
        console.log(err)
      })
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="h-auto md:max-w-lg">
        <CredenzaHeader>
          <CredenzaTitle>Connect your Ledger Wallet</CredenzaTitle>
          <CredenzaDescription>Select networks and accounts to connect.</CredenzaDescription>
        </CredenzaHeader>

        <div className="px-8">
          <div className="flex flex-wrap gap-2">
            {networks.map(item => (
              <ThemeButton
                key={item}
                variant="secondarySmall"
                onClick={() => {
                  setChain(item)
                  setPath(undefined)
                }}
              >
                {chain === item && <Check className="size-4" />}
                <Image
                  className="rounded-full"
                  src={`/networks/${(item === 'EMVs' ? Network.Ethereum : item).toLowerCase()}.svg`}
                  alt={chain}
                  width="24"
                  height="24"
                />
                {item === 'EMVs' ? 'EVMs' : networkLabel(item as Network)}
              </ThemeButton>
            ))}
          </div>

          {pathOptions && (
            <div className="mt-6 grid w-full grid-cols-5 gap-3">
              <div className="col-span-4">
                <div className="mb-2 block">Derivation Path</div>
                <Select value={path} onValueChange={setPath} disabled={connecting}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {pathOptions.map(item => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <div className="mb-2 block">Index</div>
                <Input
                  className="h-9"
                  placeholder="0"
                  onChange={v => setIndex(parseInt(v.target.value || '0'))}
                  disabled={connecting}
                />
              </div>
            </div>
          )}
        </div>

        <CredenzaFooter className="flex p-8">
          <ThemeButton variant="secondaryMedium" onClick={() => onOpenChange(false)} disabled={connecting}>
            Cancel
          </ThemeButton>
          <ThemeButton variant="primaryMedium" disabled={(!!pathOptions && !path) || connecting} onClick={onConnect}>
            {connecting && <LoaderCircle size={20} className="animate-spin" />}
            {connecting ? 'Connecting' : 'Connect'} Ledger
          </ThemeButton>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}
