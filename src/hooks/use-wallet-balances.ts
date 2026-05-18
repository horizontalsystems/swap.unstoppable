import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { AssetValue, Chain, USwapNumber } from '@uswap/core'
import { useAssets } from '@/hooks/use-assets'
import { useRates } from '@/hooks/use-rates'
import { useAccounts, useHasHydrated } from '@/hooks/use-wallets'
import { getAlchemyTokenBalances, getThorBankBalances } from '@/lib/api'
import { getUSwap } from '@/lib/wallets'
import { WalletAccount } from '@/store/wallets-store'

const ETH_RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_ETH_RPC_URL || 'https://eth.llamarpc.com'

const ETH_SCAM_TICKERS = new Set(['HEX', 'AICC'])

function assetIdentifier(b: AssetValue): string {
  if ((b as any).isSecuredAsset) return b.symbol
  const identifier = b.isSynthetic || b.isTradeAsset ? b.ticker : b.address ? `${b.ticker}-${b.address}` : b.ticker
  return `${b.chain}.${identifier}`
}

export interface TokenBalance {
  balance: AssetValue
  amount: number
  usdValue?: USwapNumber
  logoURI?: string
}

export interface ChainWalletData {
  account: WalletAccount
  tokens: TokenBalance[]
  totalUsd?: USwapNumber
  isLoading: boolean
}

export const useWalletBalances = () => {
  const { assets } = useAssets()
  const accounts = useAccounts()
  const hasHydrated = useHasHydrated()
  const uSwap = getUSwap()

  const { iconMap, curatedIdentifiers } = useMemo(() => {
    const iconMap = new Map<string, string>()
    const curatedIdentifiers = new Set<string>()
    if (!assets) return { iconMap, curatedIdentifiers }
    for (const asset of assets) {
      const key = `${asset.identifier}`.toLowerCase()
      curatedIdentifiers.add(key)
      if (asset.logoURI) iconMap.set(key, asset.logoURI)
    }
    return { iconMap, curatedIdentifiers }
  }, [assets])

  const balanceQueries = useQueries({
    queries: accounts.map(account => ({
      queryKey: ['wallet-balance', account.provider, account.network, account.address],
      queryFn: async () => {
        const wallet = uSwap.getWallet(account.provider, account.network)
        if (!wallet || !('getBalance' in wallet)) {
          return { balances: [] as AssetValue[], alchemyLogoMap: new Map<string, string>() }
        }
        const rawBalances = await (wallet as any).getBalance(wallet.address, false)
        const balances: AssetValue[] = rawBalances ? [...rawBalances] : []

        if (account.network === Chain.THORChain) {
          const bankBalances = await getThorBankBalances(account.address)
          const seen = new Set(balances.map(b => `${b.chain}.${b.symbol}`.toLowerCase()))
          for (const b of bankBalances) {
            const key = `${b.chain}.${b.symbol}`.toLowerCase()
            if (!seen.has(key)) {
              balances.push(b)
              seen.add(key)
            }
          }
        }

        const alchemyLogoMap = new Map<string, string>()
        if (account.network === Chain.Ethereum) {
          const alchemyBalances = await getAlchemyTokenBalances(wallet.address, ETH_RPC_URL)
          const existingAddresses = new Set(balances.map(b => b.address?.toLowerCase()).filter(Boolean))
          for (const t of alchemyBalances) {
            const addr = t.contractAddress.toLowerCase()
            if (t.logo) alchemyLogoMap.set(addr, t.logo)
            if (existingAddresses.has(addr)) continue
            if (t.symbol && ETH_SCAM_TICKERS.has(t.symbol.toUpperCase())) continue
            const value = BigInt(t.tokenBalance).toString()
            try {
              const av = AssetValue.from({
                asset: `ETH.${t.symbol}-${t.contractAddress}`,
                fromBaseDecimal: t.decimals,
                value
              })
              balances.push(av)
            } catch {
              // skip tokens that can't be parsed
            }
          }
        }

        return { balances, alchemyLogoMap }
      },
      enabled: hasHydrated,
      staleTime: 30_000,
      retry: false,
      refetchOnMount: false
    }))
  })

  const isLoading = balanceQueries.some(q => q.isLoading)

  const allBalances = useMemo(() => {
    return accounts.map((account, i) => {
      const q = balanceQueries[i]
      return {
        account,
        balances: q?.data?.balances ?? ([] as AssetValue[]),
        alchemyLogoMap: q?.data?.alchemyLogoMap ?? new Map<string, string>()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, ...balanceQueries.map(q => q.data)])

  const tokenIdentifiers = useMemo(() => {
    if (!allBalances) return []
    const ids = new Set<string>()
    for (const { balances } of allBalances) {
      for (const b of balances) {
        ids.add(assetIdentifier(b))
      }
    }
    return Array.from(ids)
  }, [allBalances])

  const { rates, logos: dexScreenerLogos } = useRates(tokenIdentifiers)

  const walletData: ChainWalletData[] = useMemo(() => {
    if (!allBalances) {
      return accounts.map(account => ({ account, tokens: [], totalUsd: undefined, isLoading: true }))
    }

    return allBalances.map(({ account, balances, alchemyLogoMap }) => {
      const tokens: TokenBalance[] = balances
        .filter(b => b.ticker && b.ticker.toLowerCase() !== 'unknown')
        .map(b => {
          const rate = rates[assetIdentifier(b)]
          const amount = parseFloat(b.toSignificant())
          const usdValue = rate ? rate.mul(amount) : undefined
          const identifier = assetIdentifier(b)
          const key = identifier.toLowerCase()
          const logoURI = iconMap.get(key) ?? dexScreenerLogos[identifier] ?? (b.address ? alchemyLogoMap.get(b.address.toLowerCase()) : undefined)
          return { balance: b, amount, usdValue, logoURI }
        })
        .filter(t => {
          const key = `${assetIdentifier(t.balance)}`.toLowerCase()
          return curatedIdentifiers.has(key) || t.usdValue !== undefined
        })

      const pricedTokens = tokens.filter(t => t.usdValue !== undefined)
      const totalUsd = pricedTokens.length > 0 ? pricedTokens.slice(1).reduce((sum, t) => sum.add(t.usdValue!), pricedTokens[0].usdValue!) : undefined

      return { account, tokens, totalUsd, isLoading: false }
    })
  }, [allBalances, rates, accounts, iconMap, curatedIdentifiers, dexScreenerLogos])

  return { walletData, isLoading }
}
