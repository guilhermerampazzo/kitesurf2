'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Visão Geral',    href: '/admin',                 icon: 'bar_chart' },
  { label: 'Moderação',      href: '/admin/moderacao',       icon: 'gavel' },
  { label: 'Banners',        href: '/admin/banners',         icon: 'ad_units' },
  { label: 'Usuários',       href: '/admin/usuarios',        icon: 'group' },
  { label: 'Anúncios',       href: '/admin/anuncios',        icon: 'sell' },
  { label: 'Planos',         href: '/admin/planos',          icon: 'workspace_premium' },
  { label: 'Comissões',      href: '/admin/comissoes',       icon: 'percent' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 bg-brand-gradient text-white min-h-full flex flex-col py-5">
      <div className="px-6 pb-5">
        <Link href="/" className="text-2xl font-display font-black tracking-tight">KITE360<span className="text-accent">º</span></Link>
        <div className="text-label-md text-white/50 mt-1 uppercase tracking-widest font-display font-bold">Admin</div>
      </div>

      <nav className="flex flex-col flex-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 mx-3 my-0.5 px-4 py-2.5 rounded-full text-body-md font-semibold transition-all',
                active
                  ? 'btn-accent shadow-soft'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon name={item.icon} filled={active} size={20} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 pt-4 border-t border-white/10">
        <Link href="/painel" className="flex items-center gap-3 text-body-md text-white/70 hover:text-accent transition-colors">
          <Icon name="arrow_back" size={20} />
          Voltar ao site
        </Link>
      </div>
    </aside>
  )
}
