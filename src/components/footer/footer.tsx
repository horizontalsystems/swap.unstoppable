import { Icon } from '@/components/icons'

export function Footer() {
  return (
    <footer className="bg-tyler fixed inset-x-0 bottom-0 mx-auto hidden md:block">
      <div className="border-blade container mx-auto border-t p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-thor-gray flex items-center gap-1 text-xs">
            <span>Built by</span>
            <Icon name="unstoppable" className="size-3" />
            <a className="underline" href="https://x.com/unstoppablebyhs" rel="noopener noreferrer" target="_blank">
              Unstoppable Wallet
            </a>
          </div>

          <div className="text-thor-gray flex items-center gap-2">
            <span className="text-xs">Got questions?</span>
            <div className="flex items-center gap-2">
              <a href="mailto:swap@horizontalsystems.io">
                <Icon width={20} height={20} viewBox="0 0 20 20" name="email" />
              </a>
              <a href="https://discord.gg/UnZvkVUa" rel="noopener noreferrer" target="_blank">
                <Icon width={20} height={20} viewBox="0 0 20 20" name="discord" />
              </a>
              <a href="https://t.me/thorchain_org" rel="noopener noreferrer" target="_blank">
                <Icon width={20} height={20} viewBox="0 0 20 20" name="telegram" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
