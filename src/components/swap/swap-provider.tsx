import Image from 'next/image'
import { ProviderName } from '@/types'

export const SwapProvider = ({ provider }: { provider: ProviderName }) => {
  let title: string = provider
  let icon = title

  if (provider === 'THORCHAIN' || provider === 'THORCHAIN_STREAMING') {
    title = 'THORChain'
    icon = 'thorchain'
  } else if (provider === 'MAYACHAIN' || provider === 'MAYACHAIN_STREAMING') {
    title = 'MayaChain'
    icon = 'mayachain'
  } else if (provider === 'NEAR') {
    title = 'Near'
    icon = 'near'
  } else if (provider === 'ONEINCH') {
    title = '1inch'
    icon = 'oneinch'
  } else if (provider === 'LETSEXCHANGE') {
    title = 'LetsExchange'
    icon = 'letsexchange'
  } else if (provider === 'QUICKEX') {
    title = 'QuickEx'
    icon = 'quickex'
  } else if (provider === 'STEALTHEX') {
    title = 'StealthEX'
    icon = 'stealthex'
  } else if (provider === 'SWAPUZ') {
    title = 'Swapuz'
    icon = 'swapuz'
  }

  return (
    <div className="flex items-center gap-2">
      <Image src={`/providers/${icon}.svg`} alt="" width="16" height="16" />
      <span className="text-leah">{title}</span>
    </div>
  )
}
