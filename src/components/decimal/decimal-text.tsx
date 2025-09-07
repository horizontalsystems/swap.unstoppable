interface DecimalPropsProps {
  amount: bigint
  decimals?: number
  round?: number
  symbol?: string
  subscript?: boolean
  className?: string
}

export const DecimalText = ({ className, amount, decimals = 8, round = 6, symbol, subscript }: DecimalPropsProps) => {
  const dec = amount % BigInt(10 ** decimals)
  const int = BigInt(Math.round(Number(amount - dec) / 10 ** decimals))
  const padded = dec.toString().padStart(decimals, '0')
  const truncated = subscript ? compress(padded) : padded

  const trimmed = truncated.substring(0, round)

  return (
    <span className={className}>
      <span>
        {(int || '0').toLocaleString()}
        {round > 0 && whatDecimalSeparator()}
      </span>
      {dec.toString().length && round > 0 && <span>{trimmed}</span>}
      {symbol && <span className="ms-1">{symbol}</span>}
    </span>
  )
}

const whatDecimalSeparator = () => {
  const n = 1.1
  return n.toLocaleString().substring(1, 2)
}

const compress = (v: string): string => {
  const matches = v.match(/^(0+)([0-9]+)/)
  if (!matches) return v
  const count = matches[1].length

  if (count <= 2) return v

  const sub = {
    '0': '\u2080',
    '1': '\u2081',
    '2': '\u2082',
    '3': '\u2083',
    '4': '\u2084',
    '5': '\u2085',
    '6': '\u2086',
    '7': '\u2087',
    '8': '\u2088',
    '9': '\u2089'
  }[count]

  return '\u0030' + sub + matches[2]
}
