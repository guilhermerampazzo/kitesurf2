'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { StarRating } from '@/components/ui/StarRating'
import { vehiclesApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type VehicleDetail = {
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
  seller: { id: string; name: string; avatar?: string; isVerified?: boolean; rating?: number; reviewCount?: number }
}

export default function VeiculoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    vehiclesApi.get(id)
      .then((r) => setVehicle(r.data?.data ?? r.data))
      .catch(() => toast.error('Veículo não encontrado.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
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

  if (!vehicle) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-unit-xl text-center">
          <Icon name="directions_car" size={48} className="text-outline-variant mb-4" />
          <h1 className="text-title-lg font-bold">Veículo não encontrado</h1>
          <Link href="/veiculos" className="mt-4 inline-block text-primary font-bold hover:underline">Voltar para veículos</Link>
        </main>
        <Footer />
      </>
    )
  }

  const ficha = [
    { label: 'Marca', value: vehicle.brand },
    { label: 'Modelo', value: vehicle.model },
    { label: 'Ano', value: vehicle.year ? String(vehicle.year) : undefined },
    { label: 'Quilometragem', value: vehicle.mileage != null ? `${vehicle.mileage.toLocaleString('pt-BR')} km` : undefined },
    { label: 'Combustível', value: vehicle.fuel },
    { label: 'Câmbio', value: vehicle.transmission },
    { label: 'Cor', value: vehicle.color },
    { label: 'Tipo', value: vehicle.type },
  ].filter((r) => r.value)

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop mb-unit-xl">
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-unit-lg">
          <Link href="/" className="hover:text-primary">Home</Link>
          <Icon name="chevron_right" size={16} />
          <Link href="/veiculos" className="hover:text-primary">Veículos</Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-on-surface truncate max-w-xs">{vehicle.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-unit-xl">
          {/* Images */}
          <div className="flex-1 min-w-0">
            <div className="relative aspect-[4/3] rounded-card overflow-hidden bg-surface-container-low mb-3 photo-scrim shadow-soft">
              {vehicle.images.length > 0 ? (
                <Image src={vehicle.images[selectedImage] ?? vehicle.images[0]} alt={vehicle.title} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="directions_car" size={64} className="text-outline-variant" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 z-10 flex gap-2">
                {vehicle.isFeatured && <Badge variant="sponsored">Destaque</Badge>}
                <Badge variant="onphoto" className="capitalize">{vehicle.type}</Badge>
              </div>
            </div>

            {vehicle.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {vehicle.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${i === selectedImage ? 'border-accent-strong' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Ficha técnica */}
            <div className="mt-unit-xl card-soft p-6">
              <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-4 flex items-center gap-2">
                <Icon name="list_alt" size={20} className="text-primary" />
                Ficha técnica
              </h2>
              <div className="overflow-hidden rounded-xl border border-outline-variant">
                <table className="w-full text-body-md">
                  <tbody className="divide-y divide-outline-variant">
                    {ficha.map((row) => (
                      <tr key={row.label} className="even:bg-surface-container-low">
                        <td className="py-3 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-label-md">{row.label}</td>
                        <td className="py-3 px-4 text-on-surface font-semibold capitalize text-right">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {vehicle.features.map((f, i) => (
                    <Badge key={i} variant="success">{f}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-unit-xl card-soft p-6">
              <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-4">Descrição</h2>
              <p className="text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-wrap">{vehicle.description}</p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[360px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-unit-md">
              <div className="card-soft p-6">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="verified" className="capitalize">{vehicle.type}</Badge>
                  <span className="text-label-md text-secondary flex items-center gap-1">
                    <Icon name="visibility" size={14} /> {vehicle.viewCount ?? 0}
                  </span>
                </div>
                <h1 className="text-title-lg font-display font-extrabold text-on-surface mb-2 leading-tight">{vehicle.title}</h1>
                <div className="text-display-lg font-display font-black text-primary mb-unit-md">{formatPrice(vehicle.price)}</div>

                <div className="flex items-center gap-2 text-body-md text-secondary mb-unit-lg">
                  <Icon name="location_on" size={16} />
                  {vehicle.city}, {vehicle.state}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                  {vehicle.year && (
                    <div className="bg-surface-container rounded-xl py-3">
                      <div className="text-label-md uppercase tracking-wider text-secondary font-bold">Ano</div>
                      <div className="text-title-lg font-extrabold text-on-surface">{vehicle.year}</div>
                    </div>
                  )}
                  {vehicle.mileage != null && (
                    <div className="bg-surface-container rounded-xl py-3">
                      <div className="text-label-md uppercase tracking-wider text-secondary font-bold">KM</div>
                      <div className="text-title-lg font-extrabold text-on-surface">{vehicle.mileage.toLocaleString('pt-BR')}</div>
                    </div>
                  )}
                </div>

                <a href={`#contato`} className="block">
                  <Button variant="accent" className="w-full mb-3">
                    <Icon name="chat" size={18} />
                    Entrar em contato
                  </Button>
                </a>

                <div className="p-3 bg-primary-fixed dark:bg-primary-container rounded-xl text-label-md text-on-primary-fixed-variant dark:text-primary-fixed flex items-start gap-2">
                  <Icon name="security" size={16} className="shrink-0 mt-0.5" />
                  Negocie com segurança — não faça pagamentos fora da plataforma.
                </div>
              </div>

              {/* Seller card */}
              <div className="card-soft p-6" id="contato">
                <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-unit-md font-display font-bold">Vendedor</h3>
                <Link href={`/vendedor/${vehicle.seller.id}`} className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-on-primary font-bold text-lg overflow-hidden shrink-0">
                    {vehicle.seller.avatar ? <Image src={vehicle.seller.avatar} alt={vehicle.seller.name} width={48} height={48} className="w-full h-full object-cover" /> : vehicle.seller.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-md font-bold text-on-surface group-hover:text-primary transition-colors">{vehicle.seller.name}</span>
                      {vehicle.seller.isVerified && <Icon name="verified" filled size={16} className="text-primary" />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating value={vehicle.seller.rating ?? 0} size={14} />
                      <span className="text-label-md text-secondary">({vehicle.seller.reviewCount ?? 0})</span>
                    </div>
                  </div>
                </Link>
                <div className="mt-unit-md flex gap-2">
                  <Link href={`/vendedor/${vehicle.seller.id}`} className="flex-1">
                    <Button variant="ghost" className="w-full">Ver perfil</Button>
                  </Link>
                </div>
              </div>

              <Link href="/veiculos" className="flex items-center justify-center gap-2 text-body-md text-secondary hover:text-primary transition-colors py-2">
                <Icon name="arrow_back" size={16} />
                Voltar para lista
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
