'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from './ThemeToggle'
import { Logo } from '@/components/ui/Logo'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface NavChild {
  label: string
  href: string
  icon: string
}

interface NavGroup {
  label: string
  icon: string
  children: NavChild[]
}

const HOME = { label: 'Home', href: '/', icon: 'home' }

const BUBER = { label: 'Buber', href: '/buber', icon: 'local_taxi' }

const GROUPS: NavGroup[] = [
  {
    label: 'Equipamentos',
    icon: 'surfing',
    children: [
      { label: 'Ver tudo', href: '/buscar', icon: 'grid_view' },
      { label: 'Kitesurf', href: '/buscar?category=kitesurf', icon: 'air' },
      { label: 'Wingfoil', href: '/buscar?category=wingfoil', icon: 'surfing' },
      { label: 'Kitefoil', href: '/buscar?category=kitefoil', icon: 'tsunami' },
      { label: 'Kitewave', href: '/buscar?category=kitewave', icon: 'waves' },
      { label: 'Acessórios', href: '/buscar?category=acessorios', icon: 'build' },
    ],
  },
  {
    label: 'Aprender',
    icon: 'school',
    children: [
      { label: 'Escola', href: '/escola', icon: 'school' },
      { label: 'Treino', href: '/treino', icon: 'fitness_center' },
      { label: 'Eventos', href: '/eventos', icon: 'event' },
    ],
  },
  {
    label: 'Viagem & Moradia',
    icon: 'hotel',
    children: [
      { label: 'Imóveis', href: '/imoveis', icon: 'home_work' },
      { label: 'Hospedagem', href: '/hospedagem', icon: 'hotel' },
      { label: 'Veículos', href: '/veiculos', icon: 'directions_car' },
    ],
  },
  {
    label: 'Mais',
    icon: 'more_horiz',
    children: [
      { label: 'Moda', href: '/moda', icon: 'apparel' },
      { label: 'Serviços', href: '/servicos', icon: 'handyman' },
    ],
  },
]

interface HeaderProps {
  user?: { id: string; name: string; avatar?: string } | null
  activeCategory?: string
}

export function Header({ user, activeCategory }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  // Fecha o submenu ao trocar de rota
  useEffect(() => {
    setOpenGroup(null)
  }, [pathname])

  // Fecha com Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenGroup(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/buscar?q=${encodeURIComponent(query.trim())}`)
  }

  function childIsActive(child: NavChild) {
    if (activeCategory) return activeCategory === child.label
    if (child.href.startsWith('/buscar')) return false
    return pathname === child.href || pathname.startsWith(child.href + '/')
  }

  function groupIsActive(group: NavGroup) {
    return group.children.some(childIsActive)
  }

  function homeIsActive() {
    if (activeCategory) return activeCategory === HOME.label
    return pathname === '/'
  }

  function buberIsActive() {
    return pathname === BUBER.href || pathname.startsWith(BUBER.href + '/')
  }

  const openChildren = GROUPS.find((g) => g.label === openGroup)?.children ?? null

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

        {/* Top-level nav: Home + group menus */}
        <nav className="flex items-center gap-2 pb-2 overflow-x-auto no-scrollbar scroll-smooth" aria-label="Navegação principal">
          <Link
            href={HOME.href}
            onClick={() => setOpenGroup(null)}
            className={`nav-chip shrink-0 ${homeIsActive() ? 'nav-chip-active' : ''}`}
          >
            <Icon name={HOME.icon} size={16} filled={homeIsActive()} />
            {HOME.label}
          </Link>

          <Link
            href={BUBER.href}
            onClick={() => setOpenGroup(null)}
            className={`nav-chip shrink-0 ${buberIsActive() ? 'nav-chip-active' : ''}`}
          >
            <Icon name={BUBER.icon} size={16} filled={buberIsActive()} />
            {BUBER.label}
          </Link>

          {GROUPS.map((group) => {
            const active = groupIsActive(group)
            const open = openGroup === group.label
            return (
              <button
                key={group.label}
                type="button"
                aria-expanded={open}
                aria-haspopup="true"
                onClick={() => setOpenGroup(open ? null : group.label)}
                className={cn('nav-chip shrink-0', (active || open) && 'nav-chip-active')}
              >
                <Icon name={group.icon} size={16} filled={active || open} />
                {group.label}
                <Icon
                  name="expand_more"
                  size={16}
                  className={cn('transition-transform', open && 'rotate-180')}
                />
              </button>
            )
          })}
        </nav>

        {/* Submenu row: children of the open group */}
        {openChildren && (
          <nav
            className="flex items-center gap-2 pb-3 overflow-x-auto no-scrollbar scroll-smooth"
            aria-label={`Submenu ${openGroup}`}
          >
            <span className="shrink-0 w-px h-5 bg-outline-variant mx-1" aria-hidden="true" />
            {openChildren.map((child) => {
              const active = childIsActive(child)
              return (
                <Link
                  key={child.href + child.label}
                  href={child.href}
                  onClick={() => setOpenGroup(null)}
                  className={`nav-chip shrink-0 ${active ? 'nav-chip-active' : ''}`}
                >
                  <Icon name={child.icon} size={16} filled={active} />
                  {child.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </header>
  )
}
