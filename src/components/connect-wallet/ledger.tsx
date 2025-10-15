import Image from 'next/image'
import { ThemeButton } from '@/components/theme-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useWallets } from '@/hooks/use-wallets'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { chainLabel, WalletProps } from '@/components/connect-wallet/config'
import { Chain, WalletOption } from '@swapkit/core'

const DERIVATION_PATHS = {
  native_segwit: {
    title: 'Native Segwit',
    pathTitle: "m/84'/0'/0'/0/{index}",
    path: (index: number) => [84, 0, 0, 0, index]
  },
  native_segwit_middle: {
    title: 'Native Segwit',
    pathTitle: "m/84'/0'/{index}'/0/0",
    path: (index: number) => [84, 0, index, 0, 0]
  },
  taproot: {
    title: 'Taproot',
    pathTitle: "m/86'/0'/0'/0/{index}",
    path: (index: number) => [86, 0, 0, 0, index]
  },
  metamask: {
    title: 'Metamask',
    pathTitle: "m/44'/60'/0'/0/{index}",
    path: (index: number) => [44, 60, 0, 0, index]
  },
  ledger_live: {
    title: 'Ledger Live',
    pathTitle: "m/44'/60'/{index}'/0/0",
    path: (index: number) => [44, 60, index, 0, 0]
  },
  legacy: {
    title: 'Legacy',
    pathTitle: "m/44'/60'/0'/{index}",
    path: (index: number) => [44, 60, 0, index]
  },
  thorchain: {
    title: 'Default',
    pathTitle: "m/44'/931'/0'/0/{index}",
    path: (index: number) => [44, 931, 0, 0, index]
  }
} as const

const CHAIN_PATH_MAP: Record<string, Array<keyof typeof DERIVATION_PATHS>> = {
  EVM: ['metamask', 'ledger_live', 'legacy'],
  [Chain.Bitcoin]: ['native_segwit', 'native_segwit_middle', 'taproot'],
  [Chain.THORChain]: ['thorchain']
}

export const Ledger = ({ wallet, onConnect }: { wallet: WalletProps; onConnect: () => void }) => {
  const evmChains = [Chain.Ethereum, Chain.BinanceSmartChain, Chain.Base, Chain.Avalanche]
  const chains = ['EVM', Chain.Bitcoin, Chain.BitcoinCash, Chain.Litecoin, Chain.THORChain]

  const { connect } = useWallets()
  const [connecting, setConnecting] = useState(false)
  const [index, setIndex] = useState(0)
  const [selectedChain, setSelectedChain] = useState<string>(Chain.Bitcoin)
  const [path, setPath] = useState<string | undefined>(Object.keys(DERIVATION_PATHS)[0])

  const pathOptions = useMemo(() => {
    return CHAIN_PATH_MAP[selectedChain] ?? null
  }, [selectedChain])

  useEffect(() => {
    setPath(pathOptions?.[0])
  }, [pathOptions])

  const handleConnect = async () => {
    const chains = selectedChain === 'EVM' ? evmChains : [selectedChain]
    const derivationPath = path ? DERIVATION_PATHS[path as keyof typeof DERIVATION_PATHS].path(index) : undefined

    setConnecting(true)

    connect(WalletOption.LEDGER, chains as Chain[], derivationPath)
      .then(() => {
        onConnect()
      })
      .catch(err => {
        console.log(err)
      })
  }

  return (
    <>
      <div className="text-thor-gray mb-3 hidden px-8 text-base font-semibold md:block">Chains</div>

      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="flex-1 px-4 md:mb-4 md:px-8">
          <div
            className="grid flex-1 grid-flow-col gap-2"
            style={{
              gridTemplateRows: `repeat(${Math.ceil(chains.length / 2)}, minmax(0, 1fr))`,
              gridTemplateColumns: 'repeat(2, 1fr)'
            }}
          >
            {chains.map(chain => {
              const isSelected = selectedChain === chain

              return (
                <div
                  key={chain}
                  className={cn(
                    'hover:bg-blade flex cursor-pointer items-center gap-3 rounded-2xl border-1 border-transparent px-4 py-3',
                    {
                      'border-runes-blue': isSelected
                    }
                  )}
                  onClick={() => {
                    setSelectedChain(chain)
                  }}
                >
                  {chain === 'EVM' ? (
                    <>
                      <div className="flex -space-x-4">
                        {evmChains.map((chain, index) => {
                          return (
                            <Image
                              key={chain}
                              src={`/networks/${chain.toLowerCase()}.svg`}
                              alt={chain}
                              width="24"
                              height="24"
                              className="bg-tyler rounded-md"
                              style={{ zIndex: chains.length - index }}
                            />
                          )
                        })}
                      </div>
                      <div className="text-sm">EVMs</div>
                    </>
                  ) : (
                    <>
                      <Image src={`/networks/${chain.toLowerCase()}.svg`} alt={chain} width="24" height="24" />
                      <div className="text-sm">{chainLabel(chain as Chain)}</div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {pathOptions && (
        <div className="mb-3 grid grid-cols-5 gap-3 px-8 md:mb-6">
          <div className="col-span-4">
            <div className="text-thor-gray mb-2 font-semibold">Derivation Path</div>
            <Select value={path} onValueChange={setPath} disabled={connecting}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent
                position="item-aligned"
                className="text-leah placeholder:text-andy border-blade rounded-xl border-1"
              >
                {pathOptions.map(item => {
                  const derivationPath = DERIVATION_PATHS[item as keyof typeof DERIVATION_PATHS]

                  return (
                    <SelectItem key={item} value={item}>
                      {derivationPath.title} <span className="text-thor-gray">({derivationPath.pathTitle})</span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <div className="text-thor-gray mb-2 font-semibold">Index</div>
            <Input
              className="border-blade rounded-xl border-1 p-4 text-base font-medium"
              placeholder="0"
              onChange={v => setIndex(parseInt(v.target.value || '0'))}
              disabled={connecting}
            />
          </div>
        </div>
      )}

      <div className="flex p-4 md:justify-end md:px-8 md:pt-0 md:pb-8">
        <ThemeButton
          variant="primaryMedium"
          className="w-full md:w-auto"
          disabled={connecting}
          onClick={() => handleConnect()}
        >
          {connecting && <LoaderCircle size={20} className="animate-spin" />}
          Connect {wallet.label}
        </ThemeButton>
      </div>
    </>
  )
}
