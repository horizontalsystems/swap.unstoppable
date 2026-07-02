'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Chain } from '@uswap/core'
import { useAssetFrom, useAssetTo } from '@/hooks/use-swap'

const INFO_URL = 'https://app.barterswap.xyz/points/unstoppable'

export const BarterPromotion = () => {
  const t = useTranslations('promotion.barter')
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()

  const isEthPair = assetFrom?.chain === Chain.Ethereum && assetTo?.chain === Chain.Ethereum
  if (!isEthPair) return null

  return (
    <div className="bg-lawrence relative mt-3 overflow-hidden rounded-3xl border">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 140% at 0% 50%, rgba(255,140,32,0.28) 0%, rgba(255,140,32,0) 55%)' }}
      />

      <div className="relative flex items-center gap-3 p-3">
        <Image src="/providers/barter.svg" alt="Barter" width={48} height={48} className="size-12 shrink-0 rounded-xl" />

        <div className="min-w-0 flex-1">
          <p className="text-leah text-base font-medium">{t('title')}</p>
          <p className="text-gray text-sm">{t('description')}</p>
        </div>

        <a
          href={INFO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blade text-leah hover:bg-abraham shrink-0 rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
        >
          {t('info')}
        </a>
      </div>
    </div>
  )
}
