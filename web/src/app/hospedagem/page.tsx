'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { VerticalCTA } from '@/components/ui/VerticalCTA'
import { accommodationsApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'

type Accommodation = {
  id: string
  title: string
  description?: string
  type: string
  city: string
  state?: string
  maxGuests?: number
  bedrooms?: number
  bathrooms?: number
  amenities?: string[]
  pricePerNight: number
  cleaningFee?: number
  images?: string[] | { url: string; thumb?: string }[]
}

function getThumb(a: Accommodation): string | null {
  if (!a.images || a.images.length === 0) return null
  const first = a.images[0] as unknown
  if (typeof first === 'string') return first as string
  return (first as { url: string; thumb?: string }).thumb ?? (first as { url: string }).url ?? null
}

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'pousada', label: 'Pousada' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'chale', label: 'Chalé' },
  { value: 'flat', label: 'Flat' },
]

export default function HospedagemPage() {
  const [items, setItems] = useState<Accommodation[]>([])
  const [city, setCity] = useState('')
  const [type, setType] = useState('')
  const [guests, setGuests] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [amenities, setAmenities] = useState('')
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
      if (filters.city) params.city = filters.city as string
      if (filters.type) params.type = filters.type as string
      if (filters.guests) params.guests = filters.guests as string
      if (filters.priceMin) params.priceMin = filters.priceMin as string
      if (filters.priceMax) params.priceMax = filters.priceMax as string
      if (filters.amenities) params.amenities = filters.amenities as string
      const res = await accommodationsApi.list(Object.keys(params).length ? params : undefined)
      const data = res.data?.data ?? res.data ?? []
      const arr: Accommodation[] = Array.isArray(data) ? data : data.accommodations ?? []
      setItems(arr)
      setTotal(res.data?.total ?? arr.length)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function onFilter(e: React.FormEvent) {
    e.preventDefault()
    fetchAll({ city, type, guests, priceMin, priceMax, amenities })
  }

  function clearFilters() {
    setCity(''); setType(''); setGuests(''); setPriceMin(''); setPriceMax(''); setAmenities('')
    fetchAll({})
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24 pt-2">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-display-lg font-display font-black text-primary">
              Hospedagem <span className="accent-word">pé na areia</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant mt-2 max-w-xl">
              Hotéis, pousadas e casas para ficar perto do vento — reserve direto com o anfitrião.
            </p>
            {!loading && <p className="text-body-md text-secondary mt-1">{total} hospedagens encontradas</p>}
          </div>
          <VerticalCTA
            vertical="hospedagem"
            createHref="/hospedagem/criar"
            createLabel="Anunciar hospedagem"
            createIcon="add_home"
          />
        </div>

        {/* Filters */}
        <form onSubmit={onFilter} className="card-soft p-4 md:p-5 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Cidade</label>
              <div className="relative">
                <Icon name="location_on" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Jericoacoara"
                  className="w-full pl-8 pr-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Tipo</label>
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
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Hóspedes</label>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary cursor-pointer appearance-none"
              >
                <option value="">Qualquer</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="4">4+</option>
                <option value="6">6+</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Preço mín/noite</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Preço máx/noite</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="1000"
                className="w-full px-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Comodidades</label>
              <input
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
                placeholder="Ex: piscina, wifi"
                className="w-full px-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
              />
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
        ) : items.length === 0 ? (
          <div className="card-soft p-12 text-center">
            <Icon name="hotel" size={48} className="text-outline-variant mb-3" />
            <p className="text-body-md text-secondary">Nenhuma hospedagem encontrada com esses filtros.</p>
            <Button variant="ghost" onClick={clearFilters} className="mt-4">
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {items.map((a) => {
              const thumb = getThumb(a)
              return (
                <Link key={a.id} href={`/hospedagem/${a.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                  <div className="aspect-[16/10] bg-surface-container-low relative photo-scrim overflow-hidden">
                    {thumb ? (
                      <Image src={thumb} alt={a.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                    ) : (
                      <div className="absolute inset-0 bg-brand-gradient opacity-20 flex items-center justify-center">
                        <Icon name="hotel" size={48} className="text-white/60" />
                      </div>
                    )}
                    <Badge variant="onphoto" className="absolute top-3 left-3 z-10 capitalize">
                      {a.type}
                    </Badge>
                    <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 bg-black/45 text-white backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-bold">
                      <Icon name="location_on" size={12} /> {a.city}
                      {a.state ? `, ${a.state}` : ''}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2 leading-snug">{a.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-body-md text-secondary">
                      {a.maxGuests != null && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="group" size={14} /> {a.maxGuests} hósp.
                        </span>
                      )}
                      {a.bedrooms != null && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="bed" size={14} /> {a.bedrooms} qto
                        </span>
                      )}
                    </div>
                    {a.amenities && a.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {a.amenities.slice(0, 4).map((am) => (
                          <span key={am} className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[11px] font-semibold">
                            {am}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <span className="text-price-display font-display font-black text-primary">
                        {formatPrice(a.pricePerNight)}
                        <span className="text-body-md font-normal text-secondary">/noite</span>
                      </span>
                      <span className="text-body-md font-bold text-primary group-hover:text-accent-strong inline-flex items-center gap-1">
                        Reservar <Icon name="arrow_forward" size={16} />
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
