'use client'

import * as React from 'react'
import { Switch as SwitchPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default' | 'md' | 'lg'
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch',
        'inline-flex shrink-0 items-center rounded-full',
        'border border-transparent shadow-xs',
        'transition-all outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-primary',
        'data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
        'data-[size=sm]:h-3.5 data-[size=sm]:w-6',
        'data-[size=default]:h-[1.15rem] data-[size=default]:w-8',
        'data-[size=md]:h-6 data-[size=md]:w-11',
        'data-[size=lg]:h-7 data-[size=lg]:w-14',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-full ring-0 transition-transform',
          'bg-background',
          'dark:data-[state=checked]:bg-primary-foreground',
          'dark:data-[state=unchecked]:bg-foreground',
          'data-[state=unchecked]:translate-x-0',
          'group-data-[size=sm]/switch:data-[state=checked]:translate-x-[calc(100%-2px)]',
          'group-data-[size=default]/switch:data-[state=checked]:translate-x-[calc(100%-2px)]',
          'group-data-[size=md]/switch:data-[state=checked]:translate-x-[calc(100%+2px)]',
          'group-data-[size=lg]/switch:data-[state=checked]:translate-x-[calc(100%+6px)]',
          'group-data-[size=sm]/switch:size-3',
          'group-data-[size=default]/switch:size-4',
          'group-data-[size=md]/switch:size-5',
          'group-data-[size=lg]/switch:size-6'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
