import Image from 'next/image'
import { cn } from '@/lib/utils'

interface WalletIconProps {
  walletKey: string
  width: number
  height: number
  alt?: string
  className?: string
}

export function WalletIcon({ walletKey, width, height, alt = '', className }: WalletIconProps) {
  if (walletKey === 'ledger') {
    return (
      <>
        <Image src="/wallets/ledger-light.svg" alt={alt} width={width} height={height} className={cn('block dark:hidden', className)} />
        <Image src="/wallets/ledger-dark.svg" alt={alt} width={width} height={height} className={cn('hidden dark:block', className)} />
      </>
    )
  }

  return <Image src={`/wallets/${walletKey}.svg`} alt={alt} width={width} height={height} className={className} />
}