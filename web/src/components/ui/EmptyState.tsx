import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-4', className)}>
      <div className="trust-chip-icon !w-20 !h-20 !rounded-3xl mb-6">
        <Icon name={icon} size={40} />
      </div>
      <h3 className="text-headline-md font-display font-extrabold text-on-surface mb-2">{title}</h3>
      {description && <p className="text-body-md text-on-surface-variant max-w-sm mb-6">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 bg-brand-gradient text-on-primary font-display font-bold px-6 py-2.5 rounded-full hover:shadow-float transition-shadow"
        >
          {actionLabel}
          <Icon name="arrow_forward" size={18} />
        </Link>
      )}
    </div>
  )
}
