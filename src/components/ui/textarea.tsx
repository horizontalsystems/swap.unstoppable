import * as React from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-blade placeholder:text-andy aria-invalid:border-lucian flex field-sizing-content w-full resize-none rounded-xl border p-4 text-base font-medium break-all outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
