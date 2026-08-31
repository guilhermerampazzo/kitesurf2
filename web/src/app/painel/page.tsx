'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { authApi, listingsApi, chatApi } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import type { User, Listing, Conversation } from '@/types'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Stats {
  activeListings: number
  totalViews: number
  messages: number
  rating: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [stats, setStats] = useState<Stats>({ activeListings: 0, totalViews: 0, messages: 0, rating: 0 })

  useEffect(() => {
    Promise.all([
      authApi.me(),
      listingsApi.mine({ limit: 5 }),
      chatApi.conversations(),
    ]).then(([u, l, c]) => {
      setUser(u.data)
      const mine: Listing[] = l.data.data ?? []
      setListings(mine)
      const convs: Conversation[] = c.data ?? []
      setConversations(convs.slice(0, 5))
      setStats({
        activeListings: mine.filter((x) => x.status === 'active').length,
        totalViews: mine.reduce((s, x) => s + x.viewCount, 0),
        messages: convs.length,
        rating: u.data.rating,
      })
    }).catch(() => {
      toast.error('Sessão expirada.')
      router.push('/login')
    })
  }, [router])

  const STAT_CARDS = [
    { label: 'Anúncios ativos', value: stats.activeListings, icon: 'sell',       href: '/painel/anuncios' },
    { label: 'Visualizações',   value: stats.totalViews,     icon: 'visibility',  href: '/painel/anuncios' },
    { label: 'Mensagens',       value: stats.messages,       icon: 'chat',        href: '/mensagens' },
    { label: 'Avaliação',       value: stats.rating.toFixed(1), icon: 'star',    href: '/painel/avaliacoes' },
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar userName={user?.name} userAvatar={user?.avatar} />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-headline-lg font-display font-black text-primary">
                Olá, {user?.name?.split(' ')[0] ?? 'Bem-vindo'}!
              </h1>
              <p className="text-body-md text-on-surface-variant">Aqui está o resumo da sua conta.</p>
            </div>
            <Link href="/painel/anuncios/novo">
              <Button variant="accent">
                <Icon name="add" size={18} />
                Novo anúncio
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {STAT_CARDS.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="card-soft p-5 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-float transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="trust-chip-icon !w-11 !h-11 !rounded-2xl">
                    <Icon name={c.icon} size={22} />
                  </span>
                  <Icon name="arrow_forward" size={16} className="text-secondary group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <div className="text-headline-md font-display font-black text-on-surface">{c.value}</div>
                  <div className="text-label-md text-secondary uppercase tracking-wider">{c.label}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Latest listings */}
            <div className="card-soft p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-title-lg font-display font-extrabold text-on-surface">Meus anúncios</h2>
                <Link href="/painel/anuncios" className="text-primary text-body-md hover:text-accent-strong font-bold transition-colors">Ver todos</Link>
              </div>

              {listings.length === 0 && (
                <div className="py-8 text-center">
                  <Icon name="sell" size={40} className="text-outline-variant mb-3" />
                  <p className="text-body-md text-secondary">Você ainda não tem anúncios.</p>
                  <Link href="/painel/anuncios/novo" className="text-primary font-bold hover:text-accent-strong text-body-md">
                    Criar primeiro anúncio
                  </Link>
                </div>
              )}

              <div className="flex flex-col divide-y divide-outline-variant">
                {listings.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 py-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low overflow-hidden shrink-0">
                      {l.images[0] && (
                        <img src={l.images[0].thumb} alt={l.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-body-md font-bold text-on-surface truncate">{l.title}</div>
                      <div className="text-label-md text-secondary">{formatPrice(l.price)}</div>
                    </div>
                    <span className={`text-label-md px-2.5 py-0.5 rounded-full font-semibold ${
                      l.status === 'active'  ? 'bg-green-100 text-green-800' :
                      l.status === 'paused'  ? 'bg-amber-100 text-amber-800' :
                      'bg-surface-container text-secondary'
                    }`}>
                      {{ active: 'Ativo', paused: 'Pausado', sold: 'Vendido', draft: 'Rascunho', expired: 'Expirado', moderation: 'Em análise' }[l.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest conversations */}
            <div className="card-soft p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-title-lg font-display font-extrabold text-on-surface">Mensagens recentes</h2>
                <Link href="/mensagens" className="text-primary text-body-md hover:text-accent-strong font-bold transition-colors">Ver todas</Link>
              </div>

              {conversations.length === 0 && (
                <div className="py-8 text-center">
                  <Icon name="chat" size={40} className="text-outline-variant mb-3" />
                  <p className="text-body-md text-secondary">Nenhuma mensagem ainda.</p>
                </div>
              )}

              <div className="flex flex-col divide-y divide-outline-variant">
                {conversations.map((c) => (
                  <Link key={c.id} href={`/mensagens?conv=${c.id}`} className="flex items-center gap-3 py-3 hover:bg-surface-container -mx-2 px-2 rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-display font-bold shrink-0">
                      {c.otherUser.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-body-md font-bold text-on-surface truncate">{c.otherUser.name}</span>
                        {c.unreadCount > 0 && (
                          <span className="btn-accent text-accent-ink text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-body-md text-secondary truncate">{c.listing.title}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Verification banner */}
          {user && !user.isVerified && (
            <div className="mt-8 bg-brand-gradient rounded-card p-6 flex items-center justify-between gap-6 text-white">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <Icon name="verified_user" size={30} className="text-accent" />
                </span>
                <div>
                  <div className="text-title-lg font-display font-extrabold text-white">Obtenha o Selo Verificado</div>
                  <div className="text-body-md text-white/70">Aumente sua credibilidade e venda mais rápido.</div>
                </div>
              </div>
              <Link href="/conta/verificacao" className="shrink-0">
                <Button variant="accent">Verificar conta</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
