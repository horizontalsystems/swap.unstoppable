'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { WalletIcon } from '@/components/wallet-icon'
import { useDialog } from '@/components/global-dialog'
import { LanguageSwitchButton } from '@/components/header/language-switch-button'
import { ThemeSwitchButton } from '@/components/header/theme-switch-button'
import { TransactionHistoryButton } from '@/components/header/transaction-history-button'
import { Icon } from '@/components/icons'
import { ThemeButton } from '@/components/theme-button'
import { WalletSidebar } from '@/components/wallet-sidebar/wallet-sidebar'
import { AppConfig } from '@/config'
import { useConnectedWallets } from '@/hooks/use-wallets'
import { cn } from '@/lib/utils'

export function Header() {
  const t = useTranslations('common')
  const { openDialog } = useDialog()
  const connectedProviders = useConnectedWallets()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const openSidebar = () => openDialog(WalletSidebar, {})

  return (
    <header
      className={cn('bg-tyler sticky inset-x-0 top-0 z-50 container mx-auto p-4 transition-all duration-200', {
        'border-b': isScrolled
      })}
    >
      <div className="flex items-start justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          {AppConfig.Logo ? (
            <AppConfig.Logo />
          ) : (
            <Image src={AppConfig.logo} alt={AppConfig.title} width={AppConfig.logoWidth ?? 32} height={32} priority />
          )}
          {AppConfig.LogoText && <AppConfig.LogoText />}
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {AppConfig.id === 'unstoppable' && (
            <a href="/affiliate" className="hover:text-primary hidden px-3 text-sm font-medium transition-colors md:flex md:items-center">
              {t('integrate')}
            </a>
          )}
          <ThemeSwitchButton />
          <LanguageSwitchButton />
          <TransactionHistoryButton />
          {connectedProviders.length > 0 ? (
            <div className="flex items-center gap-1">
              {connectedProviders.map((provider, i) => (
                <ThemeButton key={i} variant="circleSmall" className="rounded-xl" onClick={openSidebar}>
                  <WalletIcon walletKey={provider.toLowerCase()} width={24} height={24} alt={provider} />
                </ThemeButton>
              ))}
            </div>
          ) : (
            <>
              <ThemeButton variant="secondarySmall" className="hidden md:flex" onClick={openSidebar}>
                {t('connectWallet')}
              </ThemeButton>
              <ThemeButton variant="circleSmall" className="flex md:hidden" onClick={openSidebar}>
                <Icon name="plus" />
              </ThemeButton>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
