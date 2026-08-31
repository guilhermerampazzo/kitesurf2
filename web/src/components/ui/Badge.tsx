import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'new' | 'used' | 'sponsored' | 'verified' | 'pending' | 'success' | 'error' | 'onphoto'
  className?: string
}

const variants = {
  new:       'bg-accent-soft text-on-tertiary-fixed',
  used:      'bg-secondary-fixed text-on-secondary-fixed',
  sponsored: 'bg-white/90 text-on-surface backdrop-blur-sm',
  verified:  'bg-primary-fixed text-on-primary-fixed-variant',
  pending:   'bg-surface-container-high text-on-surface-variant',
  success:   'bg-green-100 text-green-800',
  error:     'bg-error-container text-on-error-container',
  onphoto:   'bg-black/45 text-white backdrop-blur-sm',
}

export function Badge({ children, variant = 'pending', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-display font-extrabold uppercase tracking-wide', variants[variant], className)}>
      {children}
    </span>
  )
}
