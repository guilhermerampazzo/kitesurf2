'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { StarRating } from '@/components/ui/StarRating'
import { servicesApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type ServiceItem = {
  id: string
  title: string
  description?: string
  category: string
  pricingType: string
  price: number
  minHours?: number
  maxHours?: number
  city: string
  state: string
  images?: string[]
  seller?: { id: string; name: string; avatar?: string; isVerified?: boolean; rating?: number; reviewCount?: number }
  rating?: number
  reviewCount?: number
  isFeatured?: boolean
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas categorias' },
  { value: 'fotografia', label: 'Fotografia' },
  { value: 'video', label: 'Vídeo' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'design', label: 'Design' },
  { value: 'aula', label: 'Aula' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'outro', label: 'Outro' },
]

const PRICING_OPTIONS = [
  { value: '', label: 'Tipo de preço' },
  { value: 'fixed', label: 'Preço fixo' },
  { value: 'hourly', label: 'Por hora' },
  { value: 'daily', label: 'Por diária' },
]

const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

function pricingLabel(t: string) {
  if (t === 'hourly') return '/hora'
  if (t === 'daily') return '/dia'
  return ''
}

export default function ServicosPage() {
  const [items, setItems] = useState<ServiceItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState('')
  const [pricingType, setPricingType] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState('')

  async function fetchServices(p = 1) {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page: p, limit: 12 }
      if (q.trim()) params.q = q.trim()
      if (category) params.category = category
      if (pricingType) params.pricingType = pricingType
      if (city.trim()) params.city = city.trim()
      if (state) params.state = state
      if (priceMin) params.priceMin = priceMin
      if (priceMax) params.priceMax = priceMax
      if (sortBy) params.sortBy = sortBy
      const res = await servicesApi.list(params)
      const payload = res.data
      const data = payload?.data ?? payload ?? []
      setItems(Array.isArray(data) ? data : [])
      setTotal(payload?.total ?? 0)
      setTotalPages(payload?.totalPages ?? 1)
      setPage(payload?.page ?? p)
    } catch {
      toast.error('Erro ao carregar serviços.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchServices(1)
  }

  function clear() {
    setCategory(''); setPricingType(''); setCity(''); setState(''); setPriceMin(''); setPriceMax(''); setQ(''); setSortBy('')
    setTimeout(() => fetchServices(1), 0)
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-headline-lg font-display font-black text-primary section-rule inline-block">
              <span className="accent-word">Serviços</span> profissionais
            </h1>
            <p className="text-body-lg text-on-surface-variant mt-4 max-w-xl">
              Fotografia, vídeo, manutenção, design, aulas e consultoria — contrate direto com profissionais verificados.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/servicos/pedidos" className="inline-flex items-center gap-2 border-2 border-outline-variant text-on-surface font-display font-bold px-5 py-2.5 rounded-full hover:border-primary hover:text-primary transition-colors text-body-md">
              <Icon name="receipt_long" size={18} />
              Meus pedidos
            </Link>
            <Link href="/servicos/criar" className="btn-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-display font-extrabold text-body-md shadow-soft hover:shadow-float transition-shadow">
              <Icon name="add" size={18} />
              Anunciar serviço
            </Link>
          </div>
        </div>

        <form onSubmit={onSearch} className="card-soft p-4 md:p-5 mb-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 relative">
              <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar serviços... ex: fotografia, aula de kite" className="w-full h-11 pl-10 pr-4 bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" />
            </div>
            <div className="md:col-span-2 relative">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-11 pl-4 pr-9 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold">
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
            <div className="md:col-span-2 relative">
              <select value={pricingType} onChange={(e) => setPricingType(e.target.value)} className="w-full h-11 pl-4 pr-9 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold">
                {PRICING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
            <div className="md:col-span-2 relative">
              <Icon name="location_on" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className="w-full h-11 pl-9 pr-4 bg-surface-container-low border border-transparent rounded-full text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" />
            </div>
            <div className="md:col-span-2 relative">
              <select value={state} onChange={(e) => setState(e.target.value)} className="w-full h-11 pl-4 pr-9 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold">
                <option value="">UF</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input type="number" min="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Preço mín" className="h-11 px-4 bg-surface-container-low border border-transparent rounded-full text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" />
            <input type="number" min="0" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Preço máx" className="h-11 px-4 bg-surface-container-low border border-transparent rounded-full text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" />
            <div className="relative flex items-center gap-2 md:col-span-2">
              <label className="text-label-md font-bold text-secondary uppercase tracking-wider shrink-0 hidden md:inline">Ordenar:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="flex-1 h-11 pl-4 pr-9 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold">
                <option value="">Relevância</option>
                <option value="newest">Mais recentes</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="rating">Melhor avaliados</option>
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button type="submit" size="sm">
              <Icon name="search" size={18} /> Buscar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clear}>Limpar</Button>
          </div>
        </form>

        <div className="flex items-center justify-between mb-6">
          <p className="text-body-md text-on-surface-variant"><span className="font-bold text-on-surface">{total}</span> serviços encontrados</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon="handyman" title="Nenhum serviço encontrado" description="Tente outros termos ou remova filtros para ampliar a busca." actionLabel="Limpar filtros" actionHref="/servicos" />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {items.map((s) => (
                <Link key={s.id} href={`/servicos/${s.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                  <div className="aspect-[16/10] bg-surface-container-low overflow-hidden relative photo-scrim">
                    {s.images && s.images[0] ? (
                      <Image src={s.images[0]} alt={s.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name="handyman" size={48} className="text-white/60" />
                        <div className="absolute inset-0 bg-brand-gradient opacity-20" />
                      </div>
                    )}
                    <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10 capitalize">{s.category}</Badge>
                    <Badge variant="verified" className="absolute top-3 left-3 z-10 capitalize">{s.pricingType === 'hourly' ? 'Por hora' : s.pricingType === 'daily' ? 'Por dia' : 'Fixo'}</Badge>
                    {s.isFeatured && <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 bg-amber-400 text-black text-[11px] font-bold px-2 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-black" /> Destaque</span>}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2 leading-snug">{s.title}</h3>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-price-display font-display font-black text-primary">{formatPrice(s.price)}<span className="text-body-md font-normal text-secondary">{pricingLabel(s.pricingType)}</span></span>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-body-md text-secondary">
                      <span className="inline-flex items-center gap-1"><Icon name="location_on" size={14} /> {s.city}{s.state ? `, ${s.state}` : ''}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        {s.seller && (
                          <>
                            <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                              {s.seller.avatar ? <img src={s.seller.avatar} alt={s.seller.name} className="w-full h-full object-cover" /> : s.seller.name[0].toUpperCase()}
                            </div>
                            <span className="text-label-md font-semibold text-on-surface">{s.seller.name}</span>
                            {s.seller.isVerified && <Icon name="verified" filled size={12} className="text-primary" />}
                          </>
                        )}
                      </div>
                      {(s.rating != null || s.seller?.rating != null) && (
                        <span className="inline-flex items-center gap-1 text-label-md font-bold text-on-surface">
                          <Icon name="star" filled size={14} className="text-amber-400" />
                          {((s.rating ?? s.seller?.rating) ?? 0).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <span className="inline-flex items-center gap-1 text-body-md font-bold text-primary group-hover:text-accent-strong transition-colors">Ver detalhes <Icon name="arrow_forward" size={16} /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => fetchServices(p)} className={`w-10 h-10 flex items-center justify-center rounded-full text-body-md font-display font-bold border transition-colors ${page === p ? 'bg-brand-gradient text-white border-transparent' : 'border-outline-variant hover:border-primary text-on-surface'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
