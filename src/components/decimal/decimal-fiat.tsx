import { NumericFormat } from 'react-number-format'

interface DecimalFiatProps {
  amount: string
  decimals?: number
  symbol?: string
  className?: string
}

export const DecimalFiat = ({ className, amount, decimals = 2, symbol = '$' }: DecimalFiatProps) => {
  return (
    <NumericFormat
      className={className}
      value={amount}
      displayType="text"
      thousandSeparator=","
      decimalScale={decimals}
      fixedDecimalScale
      prefix={symbol}
    />
  )
}
