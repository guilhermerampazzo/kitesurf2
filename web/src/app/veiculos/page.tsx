'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { vehiclesApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type Vehicle = {
  id: string
  title: string
  description: string
  type: string
  brand?: string
  model?: string
  year?: number
  mileage?: number
  fuel?: string
  transmission?: string
  color?: string
  city: string
  state: string
  price: number
  images: string[]
  features?: string[]
  isFeatured?: boolean
  viewCount?: number
  createdAt?: string
  seller?: { id: string; name: string; avatar?: string; isVerified?: boolean; rating?: number }
}

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'carro', label: 'Carro' },
  { value: 'moto', label: 'Moto' },
  { value: 'lancha', label: 'Lancha' },
  { value: 'jetski', label: 'Jet Ski' },
  { value: 'quadriciclo', label: 'Quadriciclo' },
  { value: 'trailer', label: 'Trailer' },
]

const FUEL_OPTIONS = [
  { value: '', label: 'Combustível' },
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'eletrico', label: 'Elétrico' },
  { value: 'flex', label: 'Flex' },
  { value: 'hibrido', label: 'Híbrido' },
]

const TRANSMISSION_OPTIONS = [
  { value: '', label: 'Câmbio' },
  { value: 'manual', label: 'Manual' },
  { value: 'automatico', label: 'Automático' },
  { value: 'cvt', label: 'CVT' },
]

const SORT_OPTIONS = [
  { value: '', label: 'Relevância' },
  { value: 'newest', label: 'Mais recentes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
]

const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

export default function VeiculosPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  // filters
  const [type, setType] = useState('')
  const [brand, setBrand] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [yearMin, setYearMin] = useState('')
  const [yearMax, setYearMax] = useState('')
  const [fuel, setFuel] = useState('')
  const [transmission, setTransmission] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [q, setQ] = useState('')

  async function fetchVehicles(p = 1) {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page: p, limit: 12 }
      if (q.trim()) params.q = q.trim()
      if (type) params.type = type
      if (brand.trim()) params.brand = brand.trim()
      if (city.trim()) params.city = city.trim()
      if (state) params.state = state
      if (priceMin) params.priceMin = priceMin
      if (priceMax) params.priceMax = priceMax
      if (yearMin) params.yearMin = yearMin
      if (yearMax) params.yearMax = yearMax
      if (fuel) params.fuel = fuel
      if (transmission) params.transmission = transmission
      if (sortBy) params.sortBy = sortBy
      const res = await vehiclesApi.list(params)
      const payload = res.data
      const data = payload?.data ?? payload ?? []
      setVehicles(Array.isArray(data) ? data : [])
      setTotal(payload?.total ?? (Array.isArray(data) ? data.length : 0))
      setTotalPages(payload?.totalPages ?? 1)
      setPage(payload?.page ?? p)
    } catch {
      toast.error('Erro ao carregar veículos.')
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchVehicles(1)
  }

  function clearFilters() {
    setType(''); setBrand(''); setCity(''); setState(''); setPriceMin(''); setPriceMax(''); setYearMin(''); setYearMax(''); setFuel(''); setTransmission(''); setSortBy(''); setQ('')
    // fetch after state update next tick - call with empty
    setTimeout(() => fetchVehicles(1), 0)
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24">
        {/* Title */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-headline-lg font-display font-black text-primary section-rule inline-block">
              <span className="accent-word">Veículos</span> à venda
            </h1>
            <p className="text-body-lg text-on-surface-variant mt-4 max-w-xl">
              Carros, motos, lanchas e mais — direto com vendedores verificados. Filtre por tipo, marca, cidade, ano e preço.
            </p>
          </div>
          <Link href="/veiculos/criar" className="btn-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-display font-extrabold text-body-md shadow-soft hover:shadow-float transition-shadow shrink-0">
            <Icon name="add" size={18} />
            Anunciar veículo
          </Link>
        </div>

        {/* Filters */}
        <form onSubmit={onSearch} className="card-soft p-4 md:p-5 mb-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 relative">
              <Icon name="search" size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar título, marca, modelo..."
                className="w-full h-11 pl-11 pr-4 bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
              />
            </div>
            <div className="md:col-span-2 relative">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-11 pl-4 pr-9 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold">
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
            <div className="md:col-span-2 relative">
              <Icon name="branding_watermark" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Marca" className="w-full h-11 pl-9 pr-4 bg-surface-container-low border border-transparent rounded-full text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" />
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

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <input type="number" min="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Preço mín" className="h-11 px-4 bg-surface-container-low border border-transparent rounded-full text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" />
            <input type="number" min="0" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Preço máx" className="h-11 px-4 bg-surface-container-low border border-transparent rounded-full text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" />
            <input type="number" min="1900" max="2100" value={yearMin} onChange={(e) => setYearMin(e.target.value)} placeholder="Ano mín" className="h-11 px-4 bg-surface-container-low border border-transparent rounded-full text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" />
            <input type="number" min="1900" max="2100" value={yearMax} onChange={(e) => setYearMax(e.target.value)} placeholder="Ano máx" className="h-11 px-4 bg-surface-container-low border border-transparent rounded-full text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" />
            <div className="relative">
              <select value={fuel} onChange={(e) => setFuel(e.target.value)} className="w-full h-11 pl-4 pr-9 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold">
                {FUEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
            <div className="relative">
              <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="w-full h-11 pl-4 pr-9 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold">
                {TRANSMISSION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-outline-variant">
            <div className="flex items-center gap-2">
              <label className="text-label-md font-bold text-secondary uppercase tracking-wider">Ordenar:</label>
              <div className="relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-9 pl-4 pr-9 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Icon name="expand_more" size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              </div>
            </div>
            <div className="ml-auto flex gap-2">
              <Button type="submit" size="sm">
                <Icon name="search" size={18} />
                Buscar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Limpar
              </Button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between mb-6">
          <p className="text-body-md text-on-surface-variant"><span className="font-bold text-on-surface">{total}</span> veículos encontrados</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState icon="directions_car" title="Nenhum veículo encontrado" description="Tente outros termos ou remova alguns filtros para ampliar a busca." actionLabel="Limpar filtros" actionHref="/veiculos" />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {vehicles.map((v) => (
                <Link key={v.id} href={`/veiculos/${v.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                  <div className="aspect-[4/3] bg-surface-container-low overflow-hidden relative photo-scrim">
                    {v.images && v.images[0] ? (
                      <Image src={v.images[0]} alt={v.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 50vw, 25vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="directions_car" size={48} className="text-outline-variant" />
                      </div>
                    )}
                    {v.isFeatured && <Badge variant="sponsored" className="absolute top-3 left-3 z-10">Destaque</Badge>}
                    <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10 capitalize">{v.type}</Badge>
                    {v.year && <Badge variant="onphoto" className="absolute bottom-3 right-3 z-10">{v.year}</Badge>}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2 leading-snug mb-1">{v.title}</h3>
                    <div className="text-price-display font-display font-black text-primary">{formatPrice(v.price)}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px] text-on-surface-variant">
                      {v.city && <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full"><Icon name="location_on" size={12} /> {v.city}{v.state ? `, ${v.state}` : ''}</span>}
                      {v.year && <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full"><Icon name="calendar_today" size={12} /> {v.year}</span>}
                      {v.mileage != null && <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full"><Icon name="speed" size={12} /> {v.mileage.toLocaleString('pt-BR')} km</span>}
                      {v.fuel && <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full capitalize"><Icon name="local_gas_station" size={12} /> {v.fuel}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchVehicles(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-body-md font-display font-bold border transition-colors ${page === p ? 'bg-brand-gradient text-white border-transparent' : 'border-outline-variant hover:border-primary text-on-surface'}`}
                  >
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
