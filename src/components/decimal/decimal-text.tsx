import { FC } from 'react'
import { NumericFormatProps } from 'react-number-format'
import { DecimalInput } from '@/components/decimal/decimal-input'

export const DecimalText: FC<
  NumericFormatProps & {
    amount: string
    symbol?: string
  }
> = ({ amount, symbol, ...rest }) => {
  const decimal = <DecimalInput displayType="text" amount={amount} onAmountChange={() => null} autoComplete="off" {...rest} />

  if (!symbol) return decimal

  return (
    <span>
      {decimal} {symbol}
    </span>
  )
}
