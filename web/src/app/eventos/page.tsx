'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { eventsApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type TicketType = {
  id: string
  name: string
  price: number
  quantity: number
  sold: number
  remaining?: number
}
type EventItem = {
  id: string
  title: string
  coverImage?: string | null
  images: string[]
  category: string
  type: string
  city: string
  state: string
  venue?: string | null
  startDate: string
  endDate?: string | null
  isFeatured: boolean
  featuredPaid: boolean
  viewCount: number
  ticketTypes?: TicketType[]
  organizer?: { id: string; name: string; avatar?: string | null; isVerified?: boolean }
}

const CATEGORIES = [
  { value: '', label: 'Todas as categorias' },
  { value: 'kitesurf', label: 'Kitesurf' },
  { value: 'musica', label: 'Música' },
  { value: 'gastronomia', label: 'Gastronomia' },
  { value: 'esporte', label: 'Esporte' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'competicao', label: 'Competição' },
  { value: 'cultural', label: 'Cultural' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'comum', label: 'Comum' },
  { value: 'destaque', label: 'Destaque' },
  { value: 'oficial', label: 'Oficial' },
]

function cheapestPrice(ticketTypes?: TicketType[]): number | null {
  if (!ticketTypes || ticketTypes.length === 0) return null
  return Math.min(...ticketTypes.map((t) => t.price))
}

function countdown(startDate: string): string {
  const now = new Date()
  const start = new Date(startDate)
  const diff = start.getTime() - now.getTime()
  if (diff <= 0) {
    // if event started but not ended? show "Em andamento" if within 1 day else "Encerrado"
    const daysPast = Math.floor(Math.abs(diff) / 86400000)
    if (daysPast < 1) return 'Hoje'
    if (daysPast === 1) return 'Ontem'
    return 'Encerrado'
  }
  const days = Math.floor(diff / 86400000)
  if (days === 0) {
    const hours = Math.floor(diff / 3600000)
    if (hours <= 1) return 'Em poucas horas'
    return `${hours}h`
  }
  if (days === 1) return '1 dia'
  return `${days} dias`
}

function isUpcomingFilter(upcoming: boolean): string | undefined {
  if (!upcoming) return undefined
  return new Date().toISOString()
}

export default function EventosPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // filters
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('')
  const [city, setCity] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [upcoming, setUpcoming] = useState(false)
  const [isFeaturedFilterActive, setIsFeaturedFilterActive] = useState(false)

  const fetchEvents = useCallback(async (pageNum = 1) => {
    setLoading(true)
    try {
      const params: Record<string, string | number | boolean> = { page: pageNum, limit: 12 }
      if (q.trim()) params.q = q.trim()
      if (category) params.category = category
      if (type) params.type = type
      if (city.trim()) params.city = city.trim()
      if (isFeaturedFilterActive) params.isFeatured = isFeatured ? 'true' : 'false'
      const upcomingVal = isUpcomingFilter(upcoming)
      if (upcomingVal) params.startDateFrom = upcomingVal
      // status active by default in API
      const res = await eventsApi.list(params as Record<string, string | number>)
      const data = res.data
      setEvents(data.data ?? [])
      setTotal(data.total ?? 0)
      setPage(data.page ?? pageNum)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast.error('Erro ao carregar eventos.')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [q, category, type, city, isFeatured, isFeaturedFilterActive, upcoming])

  useEffect(() => {
    fetchEvents(1)
  }, [fetchEvents])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchEvents(1)
  }

  function clearFilters() {
    setQ('')
    setCategory('')
    setType('')
    setCity('')
    setIsFeatured(false)
    setIsFeaturedFilterActive(false)
    setUpcoming(false)
    // fetch will be triggered via useEffect due to dependency, but force
    setTimeout(() => fetchEvents(1), 0)
  }

  const filterActive = q || category || type || city || isFeaturedFilterActive || upcoming

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <SectionHeading
            title={<>Eventos <span className="accent-word">Kite</span></>}
            subtitle="Campeonatos, downwinds, confras e experiências — vento a favor do seu próximo rolê."
            className="!mb-0"
          />
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/eventos/meus-ingressos">
              <Button variant="ghost" size="sm"><Icon name="confirmation_number" size={18} /> Meus ingressos</Button>
            </Link>
            <Link href="/eventos/criar">
              <Button variant="accent" size="sm"><Icon name="add" size={18} /> Criar evento</Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="card-soft p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <Input placeholder="Buscar por nome ou descrição..." value={q} onChange={(e) => setQ(e.target.value)} icon="search" />
            </div>
            <div className="md:col-span-2">
              <Select label="" options={CATEGORIES} value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Select label="" options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} icon="location_on" />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" className="flex-1"><Icon name="search" size={18} /> Buscar</Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-body-md font-semibold text-on-surface">
              <input
                type="checkbox"
                checked={isFeaturedFilterActive && isFeatured}
                onChange={(e) => {
                  if (e.target.checked) { setIsFeaturedFilterActive(true); setIsFeatured(true) }
                  else { setIsFeaturedFilterActive(false); setIsFeatured(false) }
                }}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              Apenas em destaque
            </label>
            {isFeaturedFilterActive && (
              <label className="inline-flex items-center gap-2 cursor-pointer text-body-md">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 rounded border-outline-variant text-primary" />
                isFeatured = true
              </label>
            )}
            <label className="inline-flex items-center gap-2 cursor-pointer text-body-md font-semibold text-on-surface">
              <input type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
              Próximos eventos
            </label>
            {filterActive && (
              <button type="button" onClick={clearFilters} className="ml-auto text-body-md font-bold text-primary hover:text-accent-strong inline-flex items-center gap-1">
                <Icon name="filter_alt_off" size={16} /> Limpar filtros
              </button>
            )}
          </div>
        </form>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-body-md text-on-surface-variant">{loading ? 'Carregando...' : `${total} eventos encontrados`}</p>
          {totalPages > 1 && <span className="text-body-md text-secondary">Página {page} de {totalPages}</span>}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-soft overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-surface-container" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-surface-container rounded w-3/4" />
                  <div className="h-3 bg-surface-container rounded w-1/2" />
                  <div className="h-3 bg-surface-container rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon="event_busy"
            title="Nenhum evento encontrado"
            description="Tente ajustar os filtros ou crie o primeiro evento da comunidade."
            actionLabel="Criar evento"
            actionHref="/eventos/criar"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((ev) => {
                const cheapest = cheapestPrice(ev.ticketTypes)
                const cd = countdown(ev.startDate)
                const isPast = new Date(ev.startDate).getTime() < Date.now()
                return (
                  <Link key={ev.id} href={`/eventos/${ev.id}`} className="group card-soft overflow-hidden product-card-hover flex flex-col">
                    <div className="aspect-[16/10] bg-surface-container-low overflow-hidden relative">
                      {ev.coverImage ? (
                        <Image src={ev.coverImage} alt={ev.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                      ) : ev.images?.[0] ? (
                        <Image src={ev.images[0]} alt={ev.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container">
                          <Icon name="event" size={40} className="text-outline-variant" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-60 pointer-events-none" />
                      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                        <Badge variant={ev.type === 'oficial' ? 'verified' : ev.type === 'destaque' ? 'sponsored' : 'pending'} className="capitalize">
                          {ev.type}
                        </Badge>
                        {ev.isFeatured && (
                          <span className="inline-flex items-center gap-1 bg-amber-400 text-white px-2 py-1 rounded-full text-[11px] font-display font-extrabold">
                            <Icon name="star" filled size={12} /> Destaque
                          </span>
                        )}
                      </div>
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-display font-extrabold ${isPast ? 'bg-surface-container text-secondary' : 'bg-white/90 backdrop-blur text-primary'}`}>
                          {cd}
                        </span>
                      </div>
                      {ev.isFeatured && (
                        <div className="absolute bottom-3 right-3 z-10">
                          <Icon name="star" filled size={20} className="text-amber-400 drop-shadow" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="text-[11px] font-display font-bold uppercase tracking-wider text-outline mb-1 flex items-center gap-1">
                        {ev.category}
                        <span className="w-1 h-1 rounded-full bg-outline-variant inline-block" />
                        <span className="flex items-center gap-1"><Icon name="location_on" size={12} /> {ev.city}, {ev.state}</span>
                      </div>
                      <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors">{ev.title}</h3>
                      {ev.venue && <p className="text-body-md text-secondary mt-1 flex items-center gap-1"><Icon name="place" size={14} /> {ev.venue}</p>}
                      <div className="flex items-center gap-2 mt-2 text-body-md text-secondary">
                        <Icon name="calendar_today" size={14} />
                        {new Date(ev.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {ev.isFeatured && <Icon name="star" filled size={14} className="text-amber-400 ml-1" />}
                      </div>
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <span className="text-price-display font-display font-black text-primary">
                          {cheapest == null ? 'Consultar' : cheapest === 0 ? 'Grátis' : `a partir de ${formatPrice(cheapest)}`}
                        </span>
                        <span className="text-body-md font-bold text-primary group-hover:text-accent-strong inline-flex items-center gap-1">Ver <Icon name="arrow_forward" size={16} /></span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => fetchEvents(page - 1)}><Icon name="chevron_left" size={18} /> Anterior</Button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1
                  // simple pagination: show 1..totalPages if <=7 else truncate
                  return (
                    <button
                      key={p}
                      onClick={() => fetchEvents(p)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-body-md font-display font-bold border transition-colors ${page === p ? 'bg-brand-gradient text-white border-transparent' : 'border-outline-variant hover:border-primary text-on-surface'}`}
                    >
                      {p}
                    </button>
                  )
                })}
                <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => fetchEvents(page + 1)}>Próxima <Icon name="chevron_right" size={18} /></Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
