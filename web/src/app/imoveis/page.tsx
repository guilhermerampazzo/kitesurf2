'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { propertiesApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'

type Property = {
  id: string
  title: string
  description?: string
  type: string
  purpose: string
  price: number
  city: string
  state?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  images?: string[] | { url: string; thumb?: string }[]
  features?: string[]
  address?: string
}

function getThumb(p: Property): string | null {
  if (!p.images || p.images.length === 0) return null
  const first = p.images[0] as unknown
  if (typeof first === 'string') return first as string
  return (first as { url: string; thumb?: string }).thumb ?? (first as { url: string }).url ?? null
}

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'flat', label: 'Flat' },
  { value: 'kitnet', label: 'Kitnet' },
  { value: 'comercial', label: 'Comercial' },
]

const PURPOSE_OPTIONS = [
  { value: '', label: 'Venda e Aluguel' },
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' },
]

export default function ImoveisPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [type, setType] = useState('')
  const [purpose, setPurpose] = useState('')
  const [city, setCity] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchAll({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchAll(filters: Record<string, string | number>) {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {}
      if (filters.type) params.type = filters.type as string
      if (filters.purpose) params.purpose = filters.purpose as string
      if (filters.city) params.city = filters.city as string
      if (filters.priceMin) params.priceMin = filters.priceMin as string
      if (filters.priceMax) params.priceMax = filters.priceMax as string
      if (filters.bedrooms) params.bedrooms = filters.bedrooms as string
      const res = await propertiesApi.list(Object.keys(params).length ? params : undefined)
      const data = res.data?.data ?? res.data ?? []
      const arr: Property[] = Array.isArray(data) ? data : data.properties ?? []
      setProperties(arr)
      setTotal(res.data?.total ?? arr.length)
    } catch {
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  function onFilter(e: React.FormEvent) {
    e.preventDefault()
    fetchAll({ type, purpose, city, priceMin, priceMax, bedrooms })
  }

  function clearFilters() {
    setType('')
    setPurpose('')
    setCity('')
    setPriceMin('')
    setPriceMax('')
    setBedrooms('')
    fetchAll({})
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-display-lg font-display font-black text-primary">
              Imóveis <span className="accent-word">próximos do vento</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant mt-2 max-w-xl">
              Casas, flats e terrenos nos melhores picos — para morar, investir ou ficar a temporada inteira.
            </p>
            {!loading && <p className="text-body-md text-secondary mt-1">{total} imóveis encontrados</p>}
          </div>
          <Link href="/imoveis/criar">
            <Button variant="accent">
              <Icon name="add_home" size={18} />
              Anunciar imóvel
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <form onSubmit={onFilter} className="card-soft p-4 md:p-5 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Tipo</label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary cursor-pointer appearance-none"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Finalidade</label>
              <div className="relative">
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary cursor-pointer appearance-none"
                >
                  {PURPOSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Cidade</label>
              <div className="relative">
                <Icon name="location_on" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Fortaleza"
                  className="w-full pl-8 pr-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Preço mín (R$)</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Preço máx (R$)</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="1.000.000"
                className="w-full px-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Quartos</label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary cursor-pointer appearance-none"
              >
                <option value="">Qualquer</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button type="submit">
              <Icon name="search" size={18} />
              Filtrar
            </Button>
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Limpar
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : properties.length === 0 ? (
          <div className="card-soft p-12 text-center">
            <Icon name="home_work" size={48} className="text-outline-variant mb-3" />
            <p className="text-body-md text-secondary">Nenhum imóvel encontrado com esses filtros.</p>
            <Button variant="ghost" onClick={clearFilters} className="mt-4">
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {properties.map((p) => {
              const thumb = getThumb(p)
              return (
                <Link key={p.id} href={`/imoveis/${p.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                  <div className="aspect-[16/10] bg-surface-container-low relative photo-scrim overflow-hidden">
                    {thumb ? (
                      <Image src={thumb} alt={p.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                    ) : (
                      <div className="absolute inset-0 bg-brand-gradient opacity-20 flex items-center justify-center">
                        <Icon name="home" size={48} className="text-white/60" />
                      </div>
                    )}
                    <Badge variant="onphoto" className="absolute top-3 left-3 z-10 capitalize">
                      {p.type ?? 'Imóvel'}
                    </Badge>
                    <span className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${p.purpose === 'aluguel' ? 'bg-accent text-accent-ink' : 'bg-white/90 text-on-surface backdrop-blur-sm'}`}>
                      {p.purpose === 'aluguel' ? 'Aluguel' : 'Venda'}
                    </span>
                    <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 bg-black/45 text-white backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-bold">
                      <Icon name="location_on" size={12} /> {p.city}
                      {p.state ? `, ${p.state}` : ''}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2 leading-snug">{p.title}</h3>
                    <div className="text-price-display font-display font-black text-primary mt-2">
                      {formatPrice(p.price)}
                      {p.purpose === 'aluguel' && <span className="text-body-md font-normal text-secondary">/mês</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-body-md text-secondary">
                      {p.bedrooms != null && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="bed" size={14} /> {p.bedrooms} qto{p.bedrooms !== 1 ? 's' : ''}
                        </span>
                      )}
                      {p.bathrooms != null && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="bathtub" size={14} /> {p.bathrooms} ban
                        </span>
                      )}
                      {p.area != null && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="square_foot" size={14} /> {p.area} m²
                        </span>
                      )}
                    </div>
                    <div className="mt-auto pt-3">
                      <span className="text-body-md font-bold text-primary group-hover:text-accent-strong inline-flex items-center gap-1">
                        Ver detalhes <Icon name="arrow_forward" size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
