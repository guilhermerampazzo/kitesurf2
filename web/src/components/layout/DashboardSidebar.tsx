'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Dashboard',       href: '/painel',             icon: 'dashboard' },
  { label: 'Meus Anúncios',  href: '/painel/anuncios',    icon: 'sell' },
  { label: 'Mensagens',       href: '/mensagens',           icon: 'chat' },
  { label: 'Favoritos',       href: '/favoritos',           icon: 'favorite' },
  { label: 'Avaliações',      href: '/painel/avaliacoes',  icon: 'star' },
  { label: 'Planos',          href: '/planos',              icon: 'workspace_premium' },
  { label: 'Verificação',     href: '/conta/verificacao',  icon: 'verified_user' },
  { label: 'Configurações',   href: '/configuracoes',       icon: 'settings' },
]

interface DashboardSidebarProps {
  userName?: string
  userAvatar?: string
}

export function DashboardSidebar({ userName, userAvatar }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navLinks = NAV.map((item) => {
    const active = pathname === item.href || (item.href !== '/painel' && pathname.startsWith(item.href))
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          'flex items-center gap-3 mx-3 my-0.5 px-4 py-2.5 rounded-full text-body-md font-semibold transition-all',
          active
            ? 'bg-brand-gradient text-white shadow-soft'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
        )}
      >
        <Icon name={item.icon} filled={active} size={20} />
        {item.label}
      </Link>
    )
  })

  const logoutBtn = (
    <button
      onClick={() => {
        localStorage.removeItem('kite_access_token')
        localStorage.removeItem('kite_refresh_token')
        window.location.href = '/login'
      }}
      className="flex items-center gap-3 text-body-md font-semibold text-secondary hover:text-error transition-colors w-full"
    >
      <Icon name="logout" size={20} />
      Sair
    </button>
  )

  return (
    <>
      {/* ── Mobile top bar (in-flow, not fixed) ── */}
      <div className="md:hidden w-full bg-surface-container-lowest border-b border-outline-variant">
        <div className="flex items-center h-14 px-4 gap-3">
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-surface-container"
            aria-label="Menu"
          >
            <Icon name={open ? 'close' : 'menu'} size={24} className="text-on-surface" />
          </button>
          <Link href="/" className="text-lg font-display font-black text-primary">KITE360<span className="text-accent-strong">º</span></Link>
          {userName && (
            <div className="ml-auto w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm overflow-hidden shrink-0">
              {userAvatar
                ? <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                : userName[0].toUpperCase()
              }
            </div>
          )}
        </div>

        {/* Mobile drawer (expands below top bar) */}
        {open && (
          <div className="border-t border-outline-variant bg-surface-container-lowest shadow-lg">
            {userName && (
              <div className="flex items-center gap-3 px-unit-lg py-3 border-b border-outline-variant">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold overflow-hidden shrink-0">
                  {userAvatar
                    ? <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                    : userName[0].toUpperCase()
                  }
                </div>
                <div>
                  <div className="text-body-md font-bold text-on-surface">{userName}</div>
                  <div className="text-label-md text-secondary">Minha Conta</div>
                </div>
              </div>
            )}
            <nav className="flex flex-col py-1">{navLinks}</nav>
            <div className="px-unit-lg py-3 border-t border-outline-variant">{logoutBtn}</div>
          </div>
        )}
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 shrink-0 bg-surface-container-lowest border-r border-outline-variant min-h-full flex-col py-4">
        <div className="px-6 pb-4">
          <Link href="/" className="text-2xl font-display font-black text-primary tracking-tight">KITE360<span className="text-accent-strong">º</span></Link>
        </div>

        {userName && (
          <div className="flex items-center gap-3 mx-3 mb-4 p-3 rounded-2xl bg-surface-container-low">
            <div className="w-11 h-11 rounded-full bg-brand-gradient flex items-center justify-center text-on-primary font-display font-bold overflow-hidden shrink-0">
              {userAvatar
                ? <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                : userName[0].toUpperCase()
              }
            </div>
            <div className="overflow-hidden">
              <div className="text-body-md font-bold text-on-surface truncate">{userName}</div>
              <div className="text-label-md text-secondary">Minha Conta</div>
            </div>
          </div>
        )}

        <nav className="flex flex-col py-unit-sm flex-1">{navLinks}</nav>

        <div className="p-6 border-t border-outline-variant">{logoutBtn}</div>
      </aside>
    </>
  )
}
