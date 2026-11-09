import { appHref } from '@/lib/app-path'

const A = '/landing'

// Swap deep link. Slugs: bare ticker for native coins ('BTC'), CHAIN.TICKER for tokens ('ETH.USDT').
export const pair = (sell: string, buy: string) => appHref(`/sell-${sell}-buy-${buy}`)
const USDT = 'ETH.USDT'
const USDC = 'ETH.USDC'

export const LINKS = {
  app: appHref(),
  appStore: 'https://apps.apple.com/app/id1447619907',
  googlePlay: 'https://play.google.com/store/apps/details?id=io.horizontalsystems.bankwallet',
  fdroid: 'https://f-droid.org/en/packages/io.horizontalsystems.bankwallet/',
  simplex: 'https://smp4.simplex.im/a#77-iusGAT1xZHLlS44yFz8ikWlgMrUb6zxugpiknUSs',
  telegramBot: 'https://t.me/unstoppable_swap_bot',
  x: 'https://x.com/unstoppablebyhs',
  telegram: 'https://t.me/unstoppable_announcements',
  github: 'https://github.com/horizontalsystems',
  support: 'https://unstoppable.money/support'
}

export const VIDEO = {
  hero: { webm: `${A}/video/hero.webm`, mp4: `${A}/video/hero.mp4` },
  best: { webm: `${A}/video/best-price.webm`, mp4: `${A}/video/best-price.mp4` },
  footer: { webm: `${A}/video/footer.webm`, mp4: `${A}/video/footer.mp4` }
}

export const IMG = {
  logo: `${A}/logo.svg`,
  hs: `${A}/horizontal-systems.svg`,
  walletIcon: `${A}/ways/wallet-icon.png`,
  walletScreen: `${A}/ways/wallet-screen.png`,
  botIcon: `${A}/ways/bot-icon.jpg`,
  botScreen: `${A}/ways/bot-screen.png`,
  appStore: `${A}/ways/app-store.svg`,
  googlePlay: `${A}/ways/google-play.svg`,
  fdroid: `${A}/ways/f-droid.svg`,
  simplex: `${A}/ways/simplex.svg`,
  telegramBot: `${A}/ways/telegram.svg`,
  x: `${A}/social/x.svg`,
  telegram: `${A}/social/telegram.svg`,
  github: `${A}/social/github.svg`
}

export const token = (id: string) => `${A}/tokens/${id}.svg`

// Hero demo: one word + one sell/buy pair per slide. Static demo rates (Sep 2026).
export const HERO_SLIDES = [
  {
    word: 'Stablecoins',
    sell: { icon: token('usdt'), ticker: 'USDT', name: 'Tether', amount: '39 000.00', fiat: '$39 000.00' },
    buy: { icon: token('usdc'), ticker: 'USDC', name: 'USD Coin', amount: '38 996.10', fiat: '$38 996.10' }
  },
  {
    word: 'Stocks',
    sell: { icon: token('usdt'), ticker: 'USDT', name: 'Tether', amount: '39 000.00', fiat: '$39 000.00' },
    buy: { icon: token('nvdax'), ticker: 'NVDAx', name: 'NVIDIA', amount: '173.933', fiat: '$38 961.00' }
  },
  {
    word: 'Privacy Coins',
    sell: { icon: token('btc'), ticker: 'BTC', name: 'Bitcoin', amount: '0.5', fiat: '$39 000.00' },
    buy: { icon: token('xmr'), ticker: 'XMR', name: 'Monero', amount: '77.1505', fiat: '$38 961.00' }
  }
]

export type AssetTile = { id: string; alt: string; href: string; round?: boolean }

export const ASSET_ROWS: { title: string; items: AssetTile[] }[] = [
  {
    title: 'Assets',
    items: [
      { id: 'eth', alt: 'ETH', href: pair(USDT, 'ETH'), round: true },
      { id: 'usdt', alt: 'USDT', href: pair('BTC', USDT) },
      { id: 'usdc', alt: 'USDC', href: pair('BTC', USDC) }
    ]
  },
  {
    title: 'Tokenized Stocks',
    items: [
      { id: 'googlx', alt: 'Google', href: pair(USDT, 'ROBINHOOD.GOOGL') },
      { id: 'aaplx', alt: 'Apple', href: pair(USDT, 'ROBINHOOD.AAPL') },
      { id: 'nvdax', alt: 'NVIDIA', href: pair(USDT, 'ROBINHOOD.NVDA') }
    ]
  },
  {
    title: 'Privacy Coins',
    items: [
      { id: 'btc', alt: 'BTC', href: pair(USDT, 'BTC') },
      { id: 'xmr', alt: 'XMR', href: pair(USDT, 'XMR') },
      { id: 'zec', alt: 'ZEC', href: pair(USDT, 'ZEC') }
    ]
  }
]

export const PROVIDERS = ['Uniswap', '1inch', 'THORChain', 'PancakeSwap', 'Jupiter', 'Curve']

export type Pair = {
  title: string
  chains: [string, string]
  icons: [AssetTile, AssetTile]
  volume: string
  href: string
  dark?: boolean
}

export const PAIRS: Pair[] = [
  {
    title: 'USDT → TRX',
    chains: ['Ethereum', 'Tron'],
    icons: [
      { id: 'usdt', alt: 'USDT', href: '' },
      { id: 'trx', alt: 'TRX', href: '' }
    ],
    volume: '$60.1K',
    href: pair(USDT, 'TRX'),
    dark: true
  },
  {
    title: 'BTC → XMR',
    chains: ['Bitcoin', 'Monero'],
    icons: [
      { id: 'btc', alt: 'BTC', href: '' },
      { id: 'xmr', alt: 'XMR', href: '' }
    ],
    volume: '$849.8K',
    href: pair('BTC', 'XMR')
  },
  {
    title: 'USDT → XMR',
    chains: ['Ethereum', 'Monero'],
    icons: [
      { id: 'usdt', alt: 'USDT', href: '' },
      { id: 'xmr', alt: 'XMR', href: '' }
    ],
    volume: '$321.3K',
    href: pair(USDT, 'XMR')
  }
]

export const CHAIN_ROWS: { id: string; name: string }[][] = [
  [
    ['bitcoin', 'Bitcoin'],
    ['ethereum', 'Ethereum'],
    ['bnb', 'BNB Chain'],
    ['polygon', 'Polygon'],
    ['arbitrum', 'Arbitrum'],
    ['optimism', 'Optimism'],
    ['base', 'Base'],
    ['avalanche', 'Avalanche'],
    ['solana', 'Solana']
  ],
  [
    ['tron', 'Tron'],
    ['monero', 'Monero'],
    ['zcash', 'Zcash'],
    ['litecoin', 'Litecoin'],
    ['cardano', 'Cardano'],
    ['polkadot', 'Polkadot'],
    ['cosmos', 'Cosmos'],
    ['near', 'NEAR'],
    ['gnosis', 'Gnosis']
  ],
  [
    ['ton', 'TON'],
    ['stellar', 'Stellar'],
    ['xrp', 'XRP'],
    ['sui', 'Sui'],
    ['dash', 'Dash'],
    ['bitcoin-cash', 'Bitcoin Cash'],
    ['thorchain', 'THORChain'],
    ['maya', 'Maya']
  ]
].map(row => row.map(([id, name]) => ({ id, name })))

export const chainIcon = (id: string) => `${A}/chains/${id}.svg`

export const FEATURE_PILLS = ['Buy & Sell', 'Stocks', '1 to 1 Stable', 'Privacy Coins', 'No KYC', 'Best Price', 'Fast', 'Private Send']

export const FOOTER_NAV: { label: string; href: string; external?: boolean }[] = [
  { label: 'Home', href: '#home' },
  { label: 'Assets', href: '#dex' },
  { label: 'Support', href: LINKS.support, external: true }
]
