// Maps a raw error message to a stable translation key under `swap.error`, or to
// a passthrough text when the message has no localized equivalent (e.g. an EVM
// revert reason). The caller resolves `key` via next-intl and otherwise shows
// `text` verbatim. See `swap-error.tsx`.
export type TranslatedError = { key: string } | { text: string }

export const translateError = (message: string): TranslatedError => {
  if (
    message.includes('failed to simulate swap') &&
    message.includes('fail to add outbound tx') &&
    message.includes('not enough asset to pay for fees')
  ) {
    return { key: 'insufficientOutboundFee' }
  }

  if (message.includes('prepare outbound tx not successful') && message.includes('not enough asset to pay for fees'))
    return { key: 'insufficientWithdrawalFee' }

  if (message.includes('failed to simulate swap: failed to simulate handler') && message.includes('insufficient funds'))
    return { key: 'invalidSwap' }

  if (message.includes('spendable balance') && message.includes('is smaller than') && message.includes('insufficient funds')) {
    return { key: 'insufficientFunds' }
  }

  if (message.includes('swap Source and Target cannot be the same')) return { key: 'sourceTargetSame' }

  if (message.includes('user rejected action')) return { key: 'transactionCancelled' }

  if (message.includes('insufficient funds') || message.includes('missing revert data')) return { key: 'insufficientFundsCaps' }

  if (message.includes(`Invalid \\\"to\\\" address.`)) return { key: 'invalidToAddress' }

  if (message.includes('account sequence mismatch')) return { key: 'pendingTransaction' }

  if (message.includes('outbound amount does not meet requirements')) {
    return { key: 'insufficientReturnAmount' }
  }

  if (message.includes('failed to simulate swap: emit asset')) {
    return { key: 'slippageExceeded' }
  }
  if (message.includes('amount cannot be zero')) return { key: 'amountZero' }
  if (message.includes('Invalid Tick Size')) return { key: 'invalidPrice' }
  if (message.includes('Swap contract not found')) return { key: 'missingConfig' }
  if (/Insufficient ?Return expected/.test(message)) {
    return { key: 'insufficientLiquidity' }
  }

  const evmErr = message.match(/execution reverted: "([^"]+)"/)
  if (evmErr) return { text: evmErr[0] }

  return { text: message }
}