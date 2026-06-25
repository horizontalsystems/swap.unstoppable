import Image from 'next/image'

export function XmrtradeLogoText() {
  return (
    <>
      <Image src="/apps/xmrtrade_text_light.svg" alt="Xmrtrade" width={274} height={64} priority className="h-4 w-auto dark:hidden" />
      <Image src="/apps/xmrtrade_text_dark.svg" alt="Xmrtrade" width={274} height={64} priority className="hidden h-4 w-auto dark:block" />
    </>
  )
}
