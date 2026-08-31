'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { trainingApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type TrainerDetail = {
  id: string
  businessName: string
  bio?: string
  specialties?: string[]
  city?: string
  state?: string
  type?: string
  rating?: number
  reviewCount?: number
  avatar?: string
  user?: { name?: string; avatar?: string; rating?: number }
  services?: { id: string; title: string; price: number; duration?: number; category?: string }[]
}

export default function TrainerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [trainer, setTrainer] = useState<TrainerDetail | null>(null)
  const [services, setServices] = useState<{ id: string; title: string; price: number; duration?: number; category?: string }[]>([])

  useEffect(() => {
    trainingApi
      .getTrainer(id)
      .then((r) => {
        const data = r.data?.data ?? r.data
        setTrainer(data)
        if (Array.isArray(data.services)) setServices(data.services)
        else {
          trainingApi
            .listServices({ trainerId: id } as unknown as Record<string, string | number>)
            .then((sr) => setServices(sr.data?.data ?? sr.data ?? []))
            .catch(() => {})
        }
      })
      .catch(() => toast.error('Treinador não encontrado.'))
  }, [id])

  if (!trainer) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-unit-xl flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop mb-unit-xl">
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-unit-lg">
          <Link href="/treino" className="hover:text-primary">
            Treino
          </Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-on-surface">{trainer.businessName}</span>
        </nav>

        <div className="card-soft overflow-hidden mb-8">
          <div className="h-28 bg-brand-gradient relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 120%, #fff 0%, transparent 55%)' }} />
          </div>
          <div className="px-6 md:px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-5 items-start -mt-12">
              <div className="w-24 h-24 rounded-3xl overflow-hidden bg-brand-gradient ring-4 ring-surface-container-lowest flex items-center justify-center text-white text-3xl font-display font-black shrink-0 shadow-float">
                {trainer.avatar || trainer.user?.avatar ? (
                  <img src={trainer.avatar ?? trainer.user?.avatar ?? ''} alt={trainer.businessName} className="w-full h-full object-cover" />
                ) : (
                  trainer.businessName[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 pt-2 md:pt-14">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-headline-md font-display font-black text-on-surface">{trainer.businessName}</h1>
                  {trainer.type && <Badge variant="verified" className="capitalize">{trainer.type}</Badge>}
                </div>
                {(trainer.city || trainer.state) && (
                  <div className="flex items-center gap-1.5 mt-2 text-body-md text-secondary">
                    <Icon name="location_on" size={16} />
                    {trainer.city}
                    {trainer.state ? `, ${trainer.state}` : ''}
                  </div>
                )}
                {trainer.specialties && trainer.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {trainer.specialties.map((s) => (
                      <span key={s} className="px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-primary-fixed text-on-primary-fixed-variant">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {trainer.bio && <p className="text-body-lg text-on-surface-variant mt-6 leading-relaxed">{trainer.bio}</p>}
          </div>
        </div>

        <h2 className="text-headline-md font-display font-extrabold text-primary mb-4 section-rule inline-block">
          Serviços ({services.length})
        </h2>
        {services.length === 0 ? (
          <div className="card-soft p-10 text-center">
            <Icon name="fitness_center" size={40} className="text-outline-variant mb-3" />
            <p className="text-body-md text-secondary">Este treinador ainda não publicou serviços.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {services.map((s) => (
              <Link key={s.id} href={`/treino/${s.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                <div className="aspect-[16/10] bg-surface-container-low relative photo-scrim overflow-hidden">
                  <div className="absolute inset-0 bg-brand-gradient opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="fitness_center" size={40} className="text-white/60" />
                  </div>
                  {s.category && <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10 capitalize">{s.category}</Badge>}
                  {s.duration && (
                    <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-on-surface text-[11px] font-bold px-2.5 py-1 rounded-full">
                      <Icon name="schedule" size={12} /> {s.duration} min
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2">{s.title}</h3>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="text-price-display font-display font-black text-primary">{formatPrice(s.price)}</span>
                    <span className="text-body-md font-bold text-primary group-hover:text-accent-strong inline-flex items-center gap-1">
                      Ver detalhes <Icon name="arrow_forward" size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link href="/treino">
            <Button variant="ghost">
              <Icon name="arrow_back" size={18} />
              Voltar para Treino
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
