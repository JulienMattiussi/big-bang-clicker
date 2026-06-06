import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-bg hover:brightness-110 active:brightness-95',
  ghost: 'border border-border text-fg hover:border-accent hover:bg-surface active:bg-border',
}

const BASE =
  'rounded-md px-3 py-1.5 text-sm font-medium transition select-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'

/** Generic button. Centralizes style and feedback (hover/click). */
export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
