import Image from 'next/image'
import { ProviderName } from '@/types'

export const SwapProvider = ({ provider }: { provider: ProviderName | 'CCE' }) => {
  let title: string = provider
  let icon = title

  if (provider === 'THORCHAIN' || provider === 'THORCHAIN_STREAMING') {
    title = 'THORChain'
  } else if (provider === 'MAYACHAIN' || provider === 'MAYACHAIN_STREAMING') {
    title = 'MayaChain'
  } else if (provider === 'NEAR') {
    title = 'NEAR Intents'
  } else if (provider === 'ONEINCH') {
    title = '1inch'
    icon = 'oneinch'
  } else if (provider === 'LETSEXCHANGE') {
    title = 'LetsExchange'
  } else if (provider === 'QUICKEX') {
    title = 'QuickEx'
  } else if (provider === 'STEALTHEX') {
    title = 'StealthEX'
  } else if (provider === 'SWAPUZ') {
    title = 'Swapuz'
  } else if (provider === 'EXOLIX') {
    title = 'Exolix'
  } else if (provider === 'LIFI') {
    title = 'LI.FI'
    icon = 'lifi'
  } else if (provider === 'CCE') {
    title = 'CCE Cash'
  }

  return (
    <div className="flex items-center gap-2">
      <Image src={`/providers/${icon.toLowerCase()}.svg`} alt="" width="16" height="16" className="rounded-full" />
      <span className="text-leah">{title}</span>
    </div>
  )
}
