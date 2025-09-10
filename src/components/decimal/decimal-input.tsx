import { FC, useState } from 'react'
import { NumericFormat, NumericFormatProps, numericFormatter, OnValueChange } from 'react-number-format'

const separators = () => {
  const formatter = new Intl.NumberFormat()
  const parts = formatter.formatToParts(12345.6)
  const group = parts.find(p => p.type === 'group')?.value || ','
  const decimal = parts.find(p => p.type === 'decimal')?.value || '.'
  return { group, decimal }
}
const { decimal, group } = separators()

export const parseFixed = (v: string, decimals: number): bigint => {
  const [int, dec] = v.replaceAll(',', '').split('.')
  const intVal = BigInt(int) * 10n ** BigInt(decimals)
  const trimmed = dec?.slice(0, decimals)
  const decVal = trimmed ? BigInt(trimmed.padEnd(decimals, '0')) : 0n
  return intVal + decVal
}

const trim = /\.?0*$/

const format = (v: bigint, decimals: number): string => {
  if (decimals === 0) {
    return Number(v).toString()
  }
  // Manually split to prevent floating point issued eg (100000.92).toFixed(12) => 100000.919999999998
  const str = v.toString().padStart(decimals, '0')
  const lead = str.slice(0, -decimals)
  return numericFormatter(`${lead.length ? lead : '0'}.${str}`, { decimalScale: decimals })
}

export const DecimalInput: FC<
  NumericFormatProps & {
    amount: bigint
    onAmountChange: (v: bigint) => void
    decimals?: number
  }
> = ({ amount, decimals = 8, onAmountChange, disabled, ...rest }) => {
  const value = amount === 0n ? '' : format(amount, decimals).replace(trim, '')
  const [previousValue, setPreviousValue] = useState(value)
  const [previousAmount, setPreviousAmount] = useState(amount)
  const onValueChange: OnValueChange = values => {
    // `values.value` is always a dot separated decimal
    const intValue = parseFixed(values.value, decimals)
    setPreviousValue(values.value)
    setPreviousAmount(intValue)
    onAmountChange(intValue)
  }

  return (
    <NumericFormat
      allowNegative={false}
      decimalScale={decimals}
      decimalSeparator={decimal}
      thousandSeparator={group}
      disabled={disabled}
      placeholder="0"
      value={
        // Unique case if decimal digits are deleted up to the separator, causing
        // we want to retain the decimal separator in the input
        // Secondly don't change the input value to `trimmed` if the value hassn't changed
        // eg 100. -> 100.0, which causes a change loop and input to be reset to 100
        previousValue === `${value}.` || previousAmount === amount ? previousValue : value
      }
      onValueChange={onValueChange}
      {...rest}
    />
  )
}
