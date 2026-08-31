'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from './ThemeToggle'
import { Logo } from '@/components/ui/Logo'
import Image from 'next/image'

const CATEGORIES = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Kitesurf', href: '/buscar?category=kitesurf', icon: 'air' },
  { label: 'Wingfoil', href: '/buscar?category=wingfoil', icon: 'surfing' },
  { label: 'Kitefoil', href: '/buscar?category=kitefoil', icon: 'tsunami' },
  { label: 'Kitewave', href: '/buscar?category=kitewave', icon: 'waves' },
  { label: 'Acessórios', href: '/buscar?category=acessorios', icon: 'build' },
]

const VERTICALS = [
  { label: 'Escola',     href: '/escola',     icon: 'school' },
  { label: 'Treino',     href: '/treino',     icon: 'fitness_center' },
  { label: 'Imóveis',    href: '/imoveis',    icon: 'home_work' },
  { label: 'Hospedagem', href: '/hospedagem', icon: 'hotel' },
  { label: 'Moda',       href: '/moda',       icon: 'apparel' },
  { label: 'Veículos',   href: '/veiculos',   icon: 'directions_car' },
  { label: 'Eventos',    href: '/eventos',    icon: 'event' },
  { label: 'Serviços',   href: '/servicos',   icon: 'handyman' },
]

const ALL_NAV = [...CATEGORIES, ...VERTICALS]

interface HeaderProps {
  user?: { id: string; name: string; avatar?: string } | null
  activeCategory?: string
}

export function Header({ user, activeCategory }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/buscar?q=${encodeURIComponent(query.trim())}`)
  }

  function isActive(href: string) {
    if (activeCategory) return false
    if (href === '/') return pathname === '/'
    if (href.startsWith('/buscar')) return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="fixed top-0 w-full z-50 header-blur backdrop-blur-md border-b border-outline-variant">
      <div className="flex flex-col w-full max-w-container mx-auto px-margin-desktop">
        {/* Main row */}
        <div className="flex items-center justify-between py-unit-sm gap-gutter">
          <Logo size={56} />

          <form onSubmit={onSearch} className="flex-1 max-w-3xl relative">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar kites, pranchas, wings..."
              className="w-full h-11 pl-11 pr-4 bg-surface-container-low border border-transparent hover:border-outline-variant rounded-full text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest focus:shadow-[0_0_0_4px_rgba(31,71,123,0.12)] transition-all"
            />
          </form>

          <div className="flex items-center gap-unit-sm">
            <ThemeToggle />

            {user ? (
              <>
                <Link href="/mensagens" className="p-2 hover:bg-surface-container rounded-full transition-colors">
                  <Icon name="mail" size={22} className="text-secondary" />
                </Link>
                <Link href="/painel/anuncios/novo">
                  <Button variant="accent" size="sm">
                    <Icon name="add" size={18} />
                    Anunciar
                  </Button>
                </Link>
                <Link href="/painel" className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary-fixed hover:border-accent transition-colors">
                  {user.avatar
                    ? <Image src={user.avatar} alt={user.name} width={36} height={36} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-brand-gradient flex items-center justify-center text-on-primary font-display font-bold text-sm">
                        {user.name[0].toUpperCase()}
                      </div>
                  }
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Entrar</Button>
                </Link>
                <Link href="/cadastro">
                  <Button variant="accent" size="sm">
                    <Icon name="add" size={18} />
                    Anunciar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Category + Verticals nav — scrollable on mobile */}
        <nav className="flex items-center gap-2 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
          {ALL_NAV.map((cat) => {
            const active = activeCategory ? activeCategory === cat.label : isActive(cat.href)
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className={`nav-chip shrink-0 ${active ? 'nav-chip-active' : ''}`}
              >
                <Icon name={cat.icon} size={16} filled={active} />
                {cat.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
