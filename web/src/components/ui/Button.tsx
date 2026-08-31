import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-display font-extrabold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-full hover:-translate-y-px'
    const variants = {
      primary:   'btn-primary shadow-soft hover:shadow-float',
      accent:    'btn-accent shadow-soft hover:shadow-float',
      secondary: 'bg-secondary-container text-on-secondary-fixed hover:bg-secondary-fixed-dim',
      ghost:     'bg-transparent border-2 border-outline-variant text-on-surface hover:border-primary hover:text-primary',
      danger:    'bg-error text-on-error hover:opacity-90',
    }
    const sizes = {
      sm: 'px-4 py-1.5 text-body-md',
      md: 'px-6 py-2.5 text-body-md',
      lg: 'px-8 py-3.5 text-title-lg',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
