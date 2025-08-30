import { NumericFormat } from 'react-number-format'

interface DecimalFiatProps {
  amount: string
  decimals?: number
  symbol?: string
}

export const DecimalFiat = ({ amount, decimals = 2, symbol = '$' }: DecimalFiatProps) => {
  return (
    <NumericFormat
      value={amount}
      displayType="text"
      thousandSeparator=","
      decimalScale={decimals}
      fixedDecimalScale
      prefix={symbol}
    />
  )
}
