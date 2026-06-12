import { useTranslations } from 'next-intl'
import { Icon } from '@/components/icons'
import { AppConfig } from '@/config'

export function Footer() {
  const t = useTranslations('footer')
  return (
    <footer className="bg-tyler fixed inset-x-0 bottom-0 mx-auto hidden md:block">
      <div className="container mx-auto border-t p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-thor-gray flex items-center gap-1 text-xs">
            <span>{t('builtBy')}</span>
            <Icon name="unstoppable" className="size-3" />
            <a className="underline" href="https://x.com/unstoppablebyhs" rel="noopener noreferrer" target="_blank">
              Unstoppable Wallet
            </a>
          </div>

          <div className="text-thor-gray flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span>
                {t('reportBugsTo')}{' '}
                <a className="underline" href={`mailto:${AppConfig.supportEmail}`}>
                  {AppConfig.supportEmail}
                </a>
              </span>
              <a href={`mailto:${AppConfig.supportEmail}`}>
                <Icon width={20} height={20} viewBox="0 0 20 20" name="email" />
              </a>
            </div>
            {(AppConfig.discordLink || AppConfig.telegramLink) && (
              <div className="flex items-center gap-2">
                <span>{t('gotQuestions')}</span>
                {AppConfig.discordLink && (
                  <a href={AppConfig.discordLink} rel="noopener noreferrer" target="_blank">
                    <Icon width={20} height={20} viewBox="0 0 20 20" name="discord" />
                  </a>
                )}
                {AppConfig.telegramLink && (
                  <a href={AppConfig.telegramLink} rel="noopener noreferrer" target="_blank">
                    <Icon width={20} height={20} viewBox="0 0 20 20" name="telegram" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
