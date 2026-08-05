import { useState } from 'react'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  delay?: number
  className?: string
}

export const CopyButton = ({ text, delay = 1000, className }: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)

      setTimeout(() => setIsCopied(false), delay)
    } catch (err) {
      console.log('Failed to copy text: ', err)
      setIsCopied(false)
    }
  }

  return isCopied ? (
    <Icon name="check" className={cn('text-thor-gray size-5 cursor-pointer', className)} />
  ) : (
    <Icon name="copy" className={cn('text-thor-gray size-5 cursor-pointer', className)} onClick={handleCopy} />
  )
}
