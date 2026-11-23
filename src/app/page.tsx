import { redirect } from 'next/navigation'
import { Landing } from '@/components/landing/landing'
import { AppConfig } from '@/config'
import { APP_PATH } from '@/lib/app-path'

export const metadata = {
  alternates: { canonical: '/' }
}

export default function Page() {
  // Only the Unstoppable brand has a marketing landing; other brands open the swap directly.
  if (AppConfig.id !== 'unstoppable') redirect(APP_PATH)
  return <Landing />
}
