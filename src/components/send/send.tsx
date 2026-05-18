'use client'

import { useEffect, useState } from 'react'
import { Chain, CosmosChain, CosmosChains, EVMChain, EVMChains, FeeOption, isGasAsset, USwapNumber, UTXOChain, UTXOChains } from '@uswap/core'
import { getAddressValidator } from '@uswap/toolboxes'
import { estimateTransactionFee } from '@uswap/toolboxes/cosmos'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { WalletIcon } from '@/components/wallet-icon'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { chainLabel } from '@/components/connect-wallet/config'
import { AssetIcon } from '@/components/asset-icon'
import { DecimalInput } from '@/components/decimal/decimal-input'
import { useDialog } from '@/components/global-dialog'
import { Icon } from '@/components/icons'
import { ThemeButton } from '@/components/theme-button'
import { Tooltip } from '@/components/tooltip'
import { assetIdentifierStr, tokenToAsset } from '@/components/send/send-helpers'
import { SendSelectToken } from '@/components/send/send-select-token'
import { TokenBalance, useWalletBalances } from '@/hooks/use-wallet-balances'
import { useAccounts } from '@/hooks/use-wallets'
import { useRates } from '@/hooks/use-rates'
import { getUSwap } from '@/lib/wallets'
import { WalletAccount } from '@/store/wallets-store'
import { DecimalText } from '@/components/decimal/decimal-text'
import { cn, toCurrencyFixed, truncate } from '@/lib/utils'

export interface SendDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialToken: TokenBalance
  account: WalletAccount
}

export function Send({ isOpen, onOpenChange, initialToken, account }: SendDialogProps) {
  const uSwap = getUSwap()
  const accounts = useAccounts()
  const { openDialog } = useDialog()
  const { walletData } = useWalletBalances()

  const [selectedToken, setSelectedToken] = useState(initialToken)
  const [selectedAccount, setSelectedAccount] = useState(account)
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [isValidRecipient, setIsValidRecipient] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [txFee, setTxFee] = useState<{ amount: USwapNumber; ticker: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSelectedToken(initialToken)
      setSelectedAccount(account)
      setAmount('')
      setRecipient('')
      setIsValidRecipient(true)
      setTxFee(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const { rates } = useRates([assetIdentifierStr(selectedToken.balance)])
  const rate = rates[assetIdentifierStr(selectedToken.balance)]

  const numericAmount = parseFloat(amount) || 0
  const fiatValue = rate ? rate.mul(numericAmount) : new USwapNumber(0)

  useEffect(() => {
    if (recipient.length === 0) return setIsValidRecipient(true)
    getAddressValidator()
      .then(validate => setIsValidRecipient(validate({ address: recipient, chain: selectedToken.balance.chain })))
      .catch(() => setIsValidRecipient(false))
  }, [recipient, selectedToken])

  useEffect(() => {
    if (!isOpen) return

    const { balance } = selectedToken
    const chain = balance.chain
    const gasAsset = isGasAsset({ chain, symbol: balance.ticker })

    if (!gasAsset) {
      setTxFee({ amount: new USwapNumber(0), ticker: balance.ticker })
      return
    }

    const estimate = async () => {
      try {
        if (EVMChains.includes(chain as EVMChain)) {
          const gasLimit = 21_000n
          const evmWallet = uSwap.getWallet<EVMChain>(selectedAccount.provider, chain as EVMChain)
          if (!evmWallet) return
          const estimateFn = evmWallet.estimateGasPrices
          const gasPrices = await (typeof estimateFn === 'function' ? estimateFn() : estimateFn)
          const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = gasPrices[FeeOption.Fast]
          let fee = new USwapNumber(0)
          if (gasPrice) {
            fee = USwapNumber.fromBigInt(gasPrice * gasLimit, balance.decimal)
          } else if (maxFeePerGas && maxPriorityFeePerGas) {
            fee = USwapNumber.fromBigInt((maxFeePerGas + maxPriorityFeePerGas) * gasLimit, balance.decimal)
          }
          setTxFee({ amount: fee, ticker: balance.ticker })
        } else if (UTXOChains.includes(chain as UTXOChain)) {
          const utxoWallet = uSwap.getWallet<UTXOChain>(selectedAccount.provider, chain as UTXOChain)
          if (!utxoWallet) return
          const feeValue = await utxoWallet.estimateTransactionFee({
            recipient: selectedAccount.address,
            sender: selectedAccount.address,
            assetValue: balance.set(0.0001),
            memo: '',
            feeOptionKey: FeeOption.Fast
          })
          setTxFee({ amount: feeValue, ticker: balance.ticker })
        } else if (CosmosChains.includes(chain as CosmosChain)) {
          const fee = estimateTransactionFee({ assetValue: balance })
          setTxFee({ amount: fee, ticker: balance.ticker })
        } else if (chain === Chain.THORChain || chain === Chain.Maya) {
          setTxFee({ amount: new USwapNumber(0.02), ticker: balance.ticker })
        } else if (chain === Chain.Tron) {
          setTxFee({ amount: new USwapNumber(1), ticker: balance.ticker })
        } else {
          setTxFee({ amount: new USwapNumber(0), ticker: balance.ticker })
        }
      } catch {
        setTxFee({ amount: new USwapNumber(0), ticker: balance.ticker })
      }
    }

    void estimate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedToken])

  const handleSend = () => {
    if (!amount || numericAmount <= 0 || !recipient || !isValidRecipient) return
    const assetValue = selectedToken.balance.set(numericAmount)
    setSubmitting(true)

    const wallet = uSwap.getWallet(selectedAccount.provider, selectedToken.balance.chain)
    if (!wallet) {
      setSubmitting(false)
      toast.error('Wallet not connected. Please reconnect.')
      return
    }

    const broadcast = (wallet as any)
      .transfer({ assetValue, recipient, feeOptionKey: FeeOption.Fast })
      .then(() => onOpenChange(false))
      .catch((err: any) => {
        setSubmitting(false)
        throw err
      })

    toast.promise(broadcast, {
      loading: 'Submitting transaction...',
      success: () => 'Transaction submitted',
      error: (err: any) => err?.message || 'Error submitting transaction'
    })
  }

  const totalTokenCount = walletData.reduce((sum, { tokens }) => sum + tokens.filter(t => t.amount > 0).length, 0)
  const selectedAsset = tokenToAsset(selectedToken)
  const feeRate = rates[assetIdentifierStr(selectedToken.balance)]
  const feeUsd = txFee && feeRate ? feeRate.mul(parseFloat(txFee.amount.toSignificant())) : undefined
  const canSend = amount && numericAmount > 0 && recipient.length > 0 && isValidRecipient && !submitting

  const openTokenSelector = () => {
    if (totalTokenCount <= 1) return
    openDialog(SendSelectToken, {
      selected: selectedToken,
      selectedAccount,
      onSelect: (token: TokenBalance, tokenAccount: WalletAccount) => {
        const chainChanged = token.balance.chain !== selectedToken.balance.chain
        setSelectedToken(token)
        setSelectedAccount(tokenAccount)
        setAmount('')
        setTxFee(null)
        if (chainChanged) setRecipient('')
      }
    })
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col rounded-2xl md:max-w-xl">
        <CredenzaHeader>
          <CredenzaTitle>Send</CredenzaTitle>
        </CredenzaHeader>

        <ScrollArea className="relative flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
          <div className="mb-2 flex flex-col gap-6">
            <div className="bg-swap-bloc rounded-15 border p-7">
              <div className="text-txt-label-small mb-3 font-semibold">Amount</div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <DecimalInput
                    className="text-txt-high-contrast w-full bg-transparent text-2xl font-medium outline-none"
                    amount={amount}
                    onAmountChange={v => setAmount(v)}
                    autoComplete="off"
                  />
                  <div className="text-txt-label-small text-sm font-medium">{toCurrencyFixed(fiatValue.toCurrency('$', { trimTrailingZeros: false }))}</div>
                </div>

                <div className={cn('flex items-center gap-2', totalTokenCount > 1 ? 'cursor-pointer' : 'cursor-default')} onClick={openTokenSelector}>
                  <AssetIcon asset={selectedAsset} />
                  <div className="flex w-16 flex-col items-start">
                    <span className="text-txt-high-contrast inline-block w-full truncate text-base font-semibold">{selectedAsset.ticker}</span>
                    <span className="text-txt-label-small inline-block w-full truncate text-xs">{chainLabel(selectedToken.balance.chain)}</span>
                  </div>
                  {totalTokenCount > 1 && <Icon name="arrow-s-down" className="text-txt-label-small size-5" />}
                </div>
              </div>

              <div className="mt-2 flex items-end justify-between">
                <div className="flex gap-2">
                  <ThemeButton className="h-6" variant="secondarySmall" onClick={() => setAmount('')} disabled={amount === ''}>
                    Clear
                  </ThemeButton>
                  <ThemeButton className="h-6" variant="secondarySmall" onClick={() => setAmount(String(selectedToken.amount * 0.5))}>
                    50%
                  </ThemeButton>
                  <ThemeButton className="h-6" variant="secondarySmall" onClick={() => setAmount(String(selectedToken.amount))}>
                    100%
                  </ThemeButton>
                </div>
                <div className="text-txt-label-small flex gap-1 text-[10px]">
                  <span>Balance:</span>
                  <span>
                    <DecimalText amount={selectedToken.balance.toSignificant()} symbol={selectedToken.balance.ticker} />
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-txt-label-small text-sm font-semibold">To</div>
              <div className="relative">
                <Textarea
                  placeholder={`${chainLabel(selectedToken.balance.chain)} address`}
                  value={recipient}
                  aria-invalid={!isValidRecipient}
                  onChange={e => setRecipient(e.target.value)}
                  className={cn('bg-swap-bloc border-border-sub-container-modal-low', {
                    'pl-13': accounts.find(a => a.network === selectedToken.balance.chain && a.address.toLowerCase() === recipient.toLowerCase())
                  })}
                />
                {(() => {
                  const currentOption = accounts.find(
                    a => a.network === selectedToken.balance.chain && a.address.toLowerCase() === recipient.toLowerCase()
                  )
                  if (currentOption) {
                    return (
                      <WalletIcon
                        walletKey={currentOption.provider.toLowerCase()}
                        alt={currentOption.provider}
                        width={24}
                        height={24}
                        className="absolute top-1/2 left-4 -translate-y-1/2"
                      />
                    )
                  }
                })()}
                {recipient.length > 0 ? (
                  <ThemeButton variant="circleSmall" className="absolute end-4 top-1/2 -translate-y-1/2" onClick={() => setRecipient('')}>
                    <Icon name="trash" />
                  </ThemeButton>
                ) : (
                  <div className="absolute end-4 top-1/2 flex -translate-y-1/2 gap-2">
                    {accounts
                      .filter(a => a.network === selectedToken.balance.chain)
                      .map((a, i) => (
                        <Tooltip key={i} content={truncate(a.address)}>
                          <ThemeButton variant="circleSmall" className="rounded-xl" onClick={() => setRecipient(a.address)}>
                            <WalletIcon walletKey={a.provider.toLowerCase()} alt={a.provider} width={24} height={24} />
                          </ThemeButton>
                        </Tooltip>
                      ))}
                    <ThemeButton
                      variant="secondarySmall"
                      className="hidden md:block"
                      onClick={() => {
                        navigator.clipboard.readText().then(text => {
                          setRecipient(text)
                        })
                      }}
                    >
                      Paste
                    </ThemeButton>
                  </div>
                )}
              </div>
              {!isValidRecipient && recipient.length > 0 && (
                <div className="text-lucian text-xs font-semibold">Invalid {chainLabel(selectedToken.balance.chain)} address</div>
              )}
            </div>

            <div className="text-txt-label-small flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">Transaction Fee</div>
              <span className="text-txt-high-contrast font-semibold">
                {txFee ? (
                  <>
                    <DecimalText amount={txFee.amount.toSignificant()} symbol={txFee.ticker} />
                    {feeUsd && ` (${toCurrencyFixed(feeUsd.toCurrency('$', { trimTrailingZeros: false }))})`}
                  </>
                ) : (
                  '—'
                )}
              </span>
            </div>
          </div>

          <div className="from-modal pointer-events-none absolute inset-x-0 -bottom-px h-4 bg-linear-to-t to-transparent" />
        </ScrollArea>

        <div className="p-4 pt-2 md:p-8 md:pt-2">
          <ThemeButton variant="primaryMedium" className="w-full" onClick={handleSend} disabled={!canSend}>
            {submitting ? <LoaderCircle size={20} className="animate-spin" /> : 'Send'}
          </ThemeButton>
        </div>
      </CredenzaContent>
    </Credenza>
  )
}
