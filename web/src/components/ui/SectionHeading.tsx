import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

interface SectionHeadingProps {
  title: React.ReactNode
  subtitle?: string
  actionLabel?: string
  actionHref?: string
  center?: boolean
  className?: string
}

export function SectionHeading({
  title,
  subtitle,
  actionLabel,
  actionHref,
  center,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex items-end justify-between gap-unit-md mb-6',
        center && 'flex-col items-center text-center',
        className
      )}
    >
      <div className={cn(center && 'flex flex-col items-center')}>
        <h2 className="text-headline-lg font-display font-black text-primary section-rule inline-block">
          {title}
        </h2>
        {subtitle && (
          <p className={cn('text-body-lg text-on-surface-variant mt-4', center && 'max-w-xl')}>
            {subtitle}
          </p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-1 text-body-md font-bold text-primary hover:text-accent-strong transition-colors shrink-0"
        >
          {actionLabel}
          <Icon name="arrow_forward" size={18} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
