'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { propertiesApi, chatApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const MapView = dynamic(() => import('@/components/ui/MapView'), { ssr: false })

type PropertyDetail = {
  id: string
  title: string
  description?: string
  type: string
  purpose: string
  price: number
  city: string
  state?: string
  address?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  lat?: number
  lng?: number
  images?: string[] | { url: string; thumb?: string }[]
  features?: string[]
  seller?: { id: string; name: string; avatar?: string; isVerified?: boolean }
  userId?: string
  ownerId?: string
}

function normalizeImages(images?: PropertyDetail['images']): string[] {
  if (!images || images.length === 0) return []
  return images.map((img) => (typeof img === 'string' ? img : (img as { url: string }).url)).filter(Boolean)
}

export default function ImovelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [contactLoading, setContactLoading] = useState(false)

  useEffect(() => {
    propertiesApi
      .get(id)
      .then((r) => setProperty(r.data?.data ?? r.data))
      .catch(() => toast.error('Imóvel não encontrado.'))
  }, [id])

  async function handleContact() {
    setContactLoading(true)
    try {
      // Try to start a conversation if listing-like; fallback to messages
      // For properties, we try chat with property id; if not supported, redirect to messages
      const res = await chatApi.startConv(id)
      router.push(`/mensagens?conv=${res.data.id ?? res.data?.id}`)
    } catch {
      toast('Faça login para falar com o anunciante.', { icon: 'ℹ️' })
      router.push('/login')
    } finally {
      setContactLoading(false)
    }
  }

  if (!property) {
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

  const images = normalizeImages(property.images)

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop mb-unit-xl">
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-unit-lg">
          <Link href="/imoveis" className="hover:text-primary">
            Imóveis
          </Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-on-surface truncate max-w-xs">{property.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-unit-xl">
          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Carousel */}
            <div className="relative aspect-[16/10] rounded-card overflow-hidden bg-surface-container-low shadow-soft mb-3 photo-scrim">
              {images.length > 0 ? (
                <Image src={images[selectedImage] ?? images[0]} alt={property.title} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-gradient opacity-30">
                  <Icon name="home" size={56} className="text-white" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 z-10 flex gap-2">
                <Badge variant="onphoto" className="capitalize">
                  {property.type}
                </Badge>
                <Badge variant={property.purpose === 'aluguel' ? 'new' : 'onphoto'}>{property.purpose === 'aluguel' ? 'Aluguel' : 'Venda'}</Badge>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${i === selectedImage ? 'border-accent-strong' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="card-soft p-6 md:p-8 mb-6">
              <h1 className="text-headline-lg font-display font-black text-primary mb-2">{property.title}</h1>
              <div className="text-display-lg font-display font-black text-primary mb-3">
                {formatPrice(property.price)}
                {property.purpose === 'aluguel' && <span className="text-body-lg font-normal text-secondary">/mês</span>}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-body-md text-secondary mb-6">
                <span className="inline-flex items-center gap-1">
                  <Icon name="location_on" size={16} />
                  {property.address ? `${property.address} — ` : ''}
                  {property.city}
                  {property.state ? `, ${property.state}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Quartos', value: property.bedrooms, icon: 'bed' },
                  { label: 'Banheiros', value: property.bathrooms, icon: 'bathtub' },
                  { label: 'Área', value: property.area ? `${property.area} m²` : undefined, icon: 'square_foot' },
                ]
                  .filter((f) => f.value != null)
                  .map((f) => (
                    <div key={f.label} className="bg-surface-container-low rounded-2xl p-4 text-center">
                      <Icon name={f.icon} size={24} className="text-primary mb-1" />
                      <div className="text-title-lg font-display font-black text-on-surface">{f.value}</div>
                      <div className="text-label-md text-secondary uppercase tracking-wider">{f.label}</div>
                    </div>
                  ))}
              </div>

              {property.features && property.features.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-title-lg font-bold text-on-surface mb-3">Características</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feat) => (
                      <span key={feat} className="px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-body-md font-semibold">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {property.description && (
                <div>
                  <h2 className="text-title-lg font-bold text-on-surface mb-3">Descrição</h2>
                  <div className="prose prose-sm max-w-none text-body-lg text-on-surface-variant leading-relaxed" dangerouslySetInnerHTML={{ __html: property.description }} />
                </div>
              )}

              {property.lat != null && property.lng != null && (
                <div className="mt-8">
                  <h2 className="text-title-lg font-bold text-on-surface mb-3">Localização</h2>
                  <MapView lat={property.lat} lng={property.lng} label={`${property.city}, ${property.state ?? ''}`} />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[340px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-unit-md">
              <div className="card-soft p-6">
                <div className="text-display-lg font-display font-black text-primary mb-1">{formatPrice(property.price)}</div>
                <p className="text-body-md text-secondary mb-4 capitalize">
                  {property.type} • {property.purpose}
                </p>

                <Button onClick={handleContact} loading={contactLoading} variant="accent" className="w-full mb-3">
                  <Icon name="chat" size={18} />
                  Falar com anunciante
                </Button>

                <Link href={`/imoveis/${property.id}/editar`} className="block">
                  <Button variant="ghost" className="w-full">
                    <Icon name="edit" size={18} />
                    Editar anúncio
                  </Button>
                </Link>

                <div className="mt-4 p-3 bg-primary-fixed dark:bg-primary-container rounded-xl text-label-md text-on-primary-fixed-variant dark:text-primary-fixed flex items-start gap-2">
                  <Icon name="security" size={16} className="shrink-0 mt-0.5" />
                  Negocie com segurança — use o chat da plataforma.
                </div>
              </div>

              {property.seller && (
                <div className="card-soft p-6">
                  <h3 className="text-label-md uppercase tracking-wider font-display font-bold text-on-surface-variant mb-3">Anunciante</h3>
                  <Link href={`/vendedor/${property.seller.id}`} className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold overflow-hidden">
                      {property.seller.avatar ? (
                        <img src={property.seller.avatar} alt={property.seller.name} className="w-full h-full object-cover" />
                      ) : (
                        property.seller.name[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-body-md font-bold text-on-surface group-hover:text-primary transition-colors">{property.seller.name}</span>
                        {property.seller.isVerified && <Icon name="verified" filled size={16} className="text-primary" />}
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
