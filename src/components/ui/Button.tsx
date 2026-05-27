import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold tap select-none transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand)]',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-white hover:bg-[var(--color-brand-strong)]',
        secondary: 'bg-card text-ink border border-line hover:bg-card-2',
        ghost: 'text-ink hover:bg-card-2',
        danger: 'bg-alert text-white hover:opacity-90',
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-xl',
        md: 'h-11 px-4 text-[15px] rounded-xl',
        lg: 'h-14 px-5 text-base rounded-2xl w-full',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = (asChild ? Slot : 'button') as 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
