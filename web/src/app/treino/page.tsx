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
import { VerticalCTA } from '@/components/ui/VerticalCTA'
import { trainingApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type Trainer = {
  id: string
  userId?: string
  businessName: string
  bio?: string
  specialties?: string[]
  city?: string
  state?: string
  type?: string
  avatar?: string
  rating?: number
  reviewCount?: number
  user?: { name?: string; avatar?: string; rating?: number }
}

type Service = {
  id: string
  title: string
  description?: string
  category?: string
  price: number
  duration?: number
  maxParticipants?: number
  trainer?: Trainer | { name?: string; businessName?: string }
  trainerId?: string
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas categorias' },
  { value: 'musculacao', label: 'Musculação' },
  { value: 'funcional', label: 'Funcional' },
  { value: 'crossfit', label: 'Crossfit' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'fisioterapia', label: 'Fisioterapia' },
  { value: 'personal', label: 'Personal' },
]

const specialtyChipCls =
  'px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary-fixed text-on-primary-fixed-variant'

export default function TreinoPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchAll(filters: Record<string, string | number>) {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {}
      if (filters.city) params.city = filters.city as string
      if (filters.category) params.category = filters.category as string
      if (filters.specialty) params.specialty = filters.specialty as string
      const [tRes, sRes] = await Promise.all([
        trainingApi.listTrainers(Object.keys(params).length ? params : undefined),
        trainingApi.listServices(filters.category ? { category: filters.category as string } : undefined),
      ])
      const tData = tRes.data?.data ?? tRes.data ?? []
      const sData = sRes.data?.data ?? sRes.data ?? []
      setTrainers(Array.isArray(tData) ? tData : [])
      setServices(Array.isArray(sData) ? sData : [])
    } catch {
      // silent — show empty
    } finally {
      setLoading(false)
    }
  }

  function onFilter(e: React.FormEvent) {
    e.preventDefault()
    fetchAll({ city, category, specialty })
  }

  function clearFilters() {
    setCity('')
    setCategory('')
    setSpecialty('')
    fetchAll({})
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24 pt-2">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-display-lg font-display font-black text-primary">
              Treino & <span className="accent-word">Bem-estar</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant mt-2 max-w-xl">
              Encontre personal trainers, fisioterapeutas e estúdios — agendamento direto com quem entende de performance na água.
            </p>
          </div>
          <VerticalCTA
            vertical="treino"
            createHref="/treino/criar"
            createLabel="Anunciar serviço"
            createIcon="add"
            mineHref="/treino/agenda"
            mineLabel="Minha agenda"
            mineIcon="calendar_month"
          />
        </div>

        {/* Filters */}
        <form onSubmit={onFilter} className="card-soft p-4 md:p-5 flex flex-col md:flex-row gap-3 mb-8">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Cidade</label>
            <div className="relative">
              <Icon name="location_on" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Fortaleza"
                className="w-full pl-9 pr-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Categoria</label>
            <div className="relative">
              <Icon name="category" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary cursor-pointer appearance-none"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Especialidade</label>
            <div className="relative">
              <Icon name="fitness_center" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex: hipertrofia, reabilitação"
                className="w-full pl-9 pr-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
              />
            </div>
          </div>

          <div className="flex items-end gap-2 shrink-0">
            <Button type="submit" className="h-[42px]">
              <Icon name="search" size={18} />
              Filtrar
            </Button>
            <Button type="button" variant="ghost" onClick={clearFilters} className="h-[42px]">
              Limpar
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Trainers */}
            <SectionHeading title={<>Treinadores em <span className="accent-word">destaque</span></>} subtitle={`${trainers.length} profissionais encontrados`} />
            {trainers.length === 0 ? (
              <div className="card-soft p-10 text-center mb-10">
                <Icon name="person_search" size={40} className="text-outline-variant mb-3" />
                <p className="text-body-md text-secondary">Nenhum treinador encontrado com esses filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 mb-12">
                {trainers.map((t) => (
                  <Link key={t.id} href={`/treino/trainer/${t.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                    <div className="p-5 flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full bg-brand-gradient flex items-center justify-center text-white text-2xl font-display font-black overflow-hidden shrink-0 shadow-soft">
                        {t.avatar || t.user?.avatar ? (
                          <img src={t.avatar ?? t.user?.avatar ?? ''} alt={t.businessName} className="w-full h-full object-cover" />
                        ) : (
                          (t.businessName ?? t.user?.name ?? '?')[0].toUpperCase()
                        )}
                      </div>
                      <h3 className="text-title-lg font-display font-extrabold text-on-surface mt-3 line-clamp-2">{t.businessName ?? t.user?.name ?? 'Treinador'}</h3>
                      {t.type && <Badge variant="verified" className="mt-2 capitalize">{t.type}</Badge>}
                      <div className="flex items-center gap-1 mt-2 text-body-md text-secondary">
                        {t.city && (
                          <>
                            <Icon name="location_on" size={14} />
                            <span>
                              {t.city}
                              {t.state ? `, ${t.state}` : ''}
                            </span>
                          </>
                        )}
                      </div>
                      {(t.rating != null || t.user?.rating != null) && (
                        <div className="flex items-center gap-1 mt-2">
                          <Icon name="star" filled size={16} className="text-amber-400" />
                          <span className="text-body-md font-bold text-on-surface">{((t.rating ?? t.user?.rating) ?? 0).toFixed(1)}</span>
                          {t.reviewCount != null && <span className="text-label-md text-secondary">({t.reviewCount})</span>}
                        </div>
                      )}
                      {t.specialties && t.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                          {t.specialties.slice(0, 3).map((s) => (
                            <span key={s} className={specialtyChipCls}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-auto px-5 pb-4">
                      <span className="w-full inline-flex items-center justify-center gap-1 text-body-md font-bold text-primary group-hover:text-accent-strong transition-colors">
                        Ver perfil <Icon name="arrow_forward" size={16} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Services */}
            <SectionHeading title={<>Serviços & <span className="accent-word">aulas</span></>} subtitle={`${services.length} serviços disponíveis`} />
            {services.length === 0 ? (
              <div className="card-soft p-10 text-center">
                <Icon name="fitness_center" size={40} className="text-outline-variant mb-3" />
                <p className="text-body-md text-secondary">Nenhum serviço encontrado com esses filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                {services.map((s) => {
                  const trainerName =
                    typeof s.trainer === 'object' && s.trainer !== null
                      ? ((s.trainer as Trainer).businessName ?? (s.trainer as { name?: string }).name ?? '')
                      : ''
                  return (
                    <Link key={s.id} href={`/treino/${s.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                      <div className="aspect-[16/10] bg-surface-container-low relative photo-scrim overflow-hidden">
                        <div className="absolute inset-0 bg-brand-gradient opacity-20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon name="fitness_center" size={48} className="text-white/60" />
                        </div>
                        {s.category && <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10 capitalize">{s.category}</Badge>}
                        {s.duration && (
                          <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-on-surface text-[11px] font-bold px-2.5 py-1 rounded-full">
                            <Icon name="schedule" size={12} /> {s.duration} min
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2 leading-snug">{s.title}</h3>
                        {s.description && <p className="text-body-md text-secondary line-clamp-2 mt-1">{stripHtml(s.description)}</p>}
                        {trainerName && (
                          <p className="text-body-md text-on-surface-variant mt-2 flex items-center gap-1">
                            <Icon name="person" size={14} /> {trainerName}
                          </p>
                        )}
                        <div className="mt-auto pt-3 flex items-center justify-between">
                          <span className="text-price-display font-display font-black text-primary">{formatPrice(s.price)}</span>
                          <span className="text-body-md font-bold text-primary group-hover:text-accent-strong inline-flex items-center gap-1">
                            Agendar <Icon name="arrow_forward" size={16} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
