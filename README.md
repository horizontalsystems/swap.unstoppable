# swap.unstoppable

Non-custodial cross-chain swap UI for [swap.unstoppable.money](https://swap.unstoppable.money). It aggregates quotes from multiple swap providers and
lets users swap directly from their own wallet — no sign-up, no custody.

Built with Next.js 16 (App Router), React 19, Tailwind v4, shadcn/ui, TanStack Query, zustand, and next-intl. Chain, wallet, and swap primitives come
from the `@uswap/*` packages.

## Features

- **Aggregated quotes** — THORChain, Maya, NEAR intents, 1inch, LI.FI, Jupiter, Barter, plus instant-exchange providers; routes are sorted by expected
  output and the user picks one.
- **Stellar swaps** — routed client-side through [`stellar-web-sdk`](https://www.npmjs.com/package/stellar-web-sdk) across StellarBroker, Soroswap,
  Aquarius, Stellar DEX, and Axelar ITS. Freighter is the supported Stellar wallet.
- **Limit swaps** — THORChain-only limit orders with cancel support.
- **Instant (memoless) swaps** — deposit-address flow that works without a connected wallet.
- **Wallets** — MetaMask / EIP-6963 injected wallets, Phantom, Keplr, OKX, Vultisig, TronLink, Freighter, Ledger, and keystore.
- **Transaction tracking** — persisted swap history with live status polling and a shareable `/track` page.
- **i18n** — 23 locales with cookie-based locale selection and RTL support.
- **White-label** — `NEXT_PUBLIC_APP_ID` switches branding between `unstoppable` (default), `xmrtrade`, and `thorxmr`.

## Getting started

Requires Node.js 20+ and npm.

```bash
npm install
cp .env.example .env   # then fill in the keys below
npm run dev            # http://localhost:3000
```

Some wallets (Freighter in particular) refuse to connect to a non-HTTPS origin. Use `npm run dev:https` for those — the first run installs a local
certificate authority via mkcert and prompts for your password.

### Scripts

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Dev server with Turbopack                      |
| `npm run dev:https` | Dev server over HTTPS (needed by some wallets) |
| `npm run build`     | Production build (`output: 'standalone'`)      |
| `npm run start`     | Serve the production build                     |
| `npm run lint`      | ESLint                                         |
| `npm run typecheck` | `tsc --noEmit`                                 |
| `npm test`          | Vitest                                         |

Formatting is Prettier (no semicolons, single quotes, `printWidth` 150, `prettier-plugin-tailwindcss`).

## Project layout

```
src/
  app/            App Router pages and API proxy routes (/api/alchemy, /api/blockchair, /api/solana, /api/stellar)
  components/     UI (shadcn/ui in components/ui, swap flow in components/swap)
  hooks/          Swap state selectors, quoting, URL sync, transaction polling
  i18n/           next-intl config and locale messages
  lib/            USwap singleton (wallets.ts), API clients (api.ts), Stellar SDK integration (lib/stellar)
  store/          zustand stores (swap, wallets, transactions, quote, limit-swap)
  types.ts        App-level asset / provider / quote types
```

## Architecture

**USwap singleton** (`src/lib/wallets.ts`) — `getUSwap()` lazily creates one `USwap` instance wired with every chain plugin (EVM, THORChain, Maya,
Radix, Solana, NEAR, P2P) and wallet adapter. `connectWallet()` connects a wallet per chain and the active wallet is resolved from the wallets store.

**API layer** (`src/lib/api.ts`) — one axios client for the uSwap aggregator backend (`/tokens`, `/quote`, `/balance`, `/track`, `/providers`), plus
separate clients for THORNode, Midgard, Maya Midgard, DexScreener, and BlocksDecoded prices. All server state goes through TanStack Query.

**Swap flow**

1. Selected assets, amount, slippage and TWAP settings live in the persisted swap store; selector hooks in `src/hooks/use-swap.ts` read them after
   hydration.
2. `src/hooks/use-quote.ts` requests quotes from the intersection of both assets' providers and sorts routes by expected output.
3. The swap dialog executes the chosen route through USwap (or the Stellar SDK) and records a transaction in the persisted history store.
4. Pending transactions are polled every few seconds and rendered on `/track`.

**Stores** (zustand, `src/store/`) — `swap-store`, `wallets-store` and `transaction-store` are persisted to localStorage and expose hydration flags;
`quote-store` and `limit-swap-store` are in-memory.

**Same-origin API proxies** (`src/app/api/`) — Solana RPC, Blockchair, Alchemy ERC-20 discovery and the Stellar upstreams are proxied through server
routes so upstream keys never ship to the browser.

## Stellar integration

Stellar swaps are quoted and executed **entirely in the browser** via `stellar-web-sdk`; the aggregator is not in the path. The SDK is dynamically
imported so `@stellar/stellar-sdk` stays out of the main bundle.

- **Venues** — StellarBroker, Soroswap, Aquarius, Stellar DEX and Axelar ITS are fanned out client-side and merged into the same route list as
  aggregator routes, ranked by the same rule (most received wins). The aggregator's own Stellar providers are withheld so no venue is quoted twice.
- **Routing rules** — both legs on Stellar → the in-chain venues compete; Stellar → Ethereum for the same token → Axelar ITS; Stellar → any other
  chain → NEAR (1Click) via the SDK.
- **Wallet** — Freighter, which implements SEP-43 `signAuthEntry` (required for StellarBroker's Soroban leg). Mainnet is enforced on connect.
- **Trustlines** — buying a classic asset the recipient does not trust is checked before committing, with a one-tap activation step when the recipient
  is the connected account.
- **Assets** — a curated list in `src/lib/stellar/asset-list.ts`, each issuer verified against mainnet (Horizon, issuer `home_domain`, SEP-1
  `stellar.toml`). A wrong issuer is a different asset sharing a ticker, so read the note there before adding entries.
- **Tracking** — each swap's tracking handle is persisted and outcomes are read from Horizon or Axelarscan, so tracking survives a reload and reports
  settled amounts rather than quoted ones.
- **Observability** — routing decisions, execution outcomes and tracking transitions are posted to `POST /api/stellar/log`, which writes one JSON line
  per event (`kind: routing | execution | tracking`) to the server's stdout for the platform log collector. Wallet addresses are deliberately not
  logged.
- **Upstreams** — `/api/stellar/rpc` proxies Horizon and Soroban RPC (Validation Cloud when a key is set, public endpoints otherwise) and
  `/api/stellar/upstream` injects the Soroswap key. Without a Validation Cloud key the public endpoints are rate-limited enough to drop routes under a
  full fan-out.

Known limitations: StellarBroker sessions may ask for several signatures and quote no on-chain minimum; Freighter is the only Stellar wallet wired up
so far.

## Routing

`/` and `/sell-<asset>-buy-<asset>` both render the swap page (e.g. `/sell-BTC-buy-XMR`). Native assets use their ticker; tokens use the full asset
identifier. `/track` renders transaction status from its search params.

## License

[MIT](LICENSE) © Horizontal Systems
