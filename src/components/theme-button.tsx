import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "active:opacity-60 hover:opacity-90 font-semibold rounded-full disabled:bg-blade disabled:text-andy inline-flex items-center justify-center gap-1 whitespace-nowrap transition-all duration-300 ease-in-out disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        primaryMedium: 'text-lawrence bg-brand-first text-base px-10 py-4',
        primarySmall: 'text-lawrence bg-brand-first text-xs px-4 h-8',
        primarySmallTransparent: 'text-brand-first text-xs px-4 h-8',
        secondaryMedium: 'text-lawrence bg-leah text-base px-10 py-4',
        secondarySmall: 'text-leah bg-blade text-xs px-4 h-8',
        secondarySmallTransparent: 'text-leah text-xs px-4 h-8',
        circleSmall: 'text-leah bg-blade text-base w-8 h-8'
      }
    },
    defaultVariants: {
      variant: 'primaryMedium'
    }
  }
)

function ThemeButton({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, className }))} {...props} />
}

export { ThemeButton, buttonVariants }
