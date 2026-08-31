import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { Icon } from './Icon'

interface AuthCardShellProps {
  title: React.ReactNode
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export function AuthCardShell({ title, subtitle, children, className }: AuthCardShellProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4 py-12">
      {/* decoração: ondas suaves no fundo */}
      <div aria-hidden className="absolute -bottom-1 left-0 right-0 h-40 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'repeating-radial-gradient(circle at 50% 120%, transparent 0, transparent 28px, #001e40 28px, #001e40 30px)' }} />

      <div className={cn('w-full max-w-md card-soft !rounded-card p-8 md:p-10 shadow-float relative', className)}>
        <div className="text-center mb-8">
          <Link href="/" aria-label="KITE360º — início">
            <div className="flex justify-center"><Logo size={48} withWordmark /></div>
          </Link>
          <h1 className="text-headline-md font-display font-extrabold text-primary mt-6">{title}</h1>
          {subtitle && <p className="text-body-md text-on-surface-variant mt-2">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  )
}

export function StatusIcon({ icon, tone = 'brand' }: { icon: string; tone?: 'brand' | 'success' | 'error' | 'muted' }) {
  const tones = {
    brand:   'bg-primary-fixed text-on-primary-fixed-variant',
    success: 'bg-green-100 text-green-600',
    error:   'bg-error-container text-error',
    muted:   'bg-surface-container-high text-on-surface-variant',
  }
  return (
    <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5', tones[tone])}>
      <Icon name={icon} size={32} />
    </div>
  )
}
