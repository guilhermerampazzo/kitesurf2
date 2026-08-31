'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { accommodationsApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type AccommodationDetail = {
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
  minNights?: number
  images?: string[] | { url: string; thumb?: string }[]
  host?: { id: string; name: string; avatar?: string }
}

function normalizeImages(images?: AccommodationDetail['images']): string[] {
  if (!images || images.length === 0) return []
  return images.map((img) => (typeof img === 'string' ? img : (img as { url: string }).url)).filter(Boolean)
}

export default function HospedagemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [acc, setAcc] = useState<AccommodationDetail | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)

  // Booking form
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('2')
  const [availabilityMsg, setAvailabilityMsg] = useState<string | null>(null)
  const [availabilityOk, setAvailabilityOk] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [totalPrice, setTotalPrice] = useState<number | null>(null)
  const [isLogged, setIsLogged] = useState<boolean | null>(null)

  useEffect(() => {
    accommodationsApi
      .get(id)
      .then((r) => setAcc(r.data?.data ?? r.data))
      .catch(() => toast.error('Hospedagem não encontrada.'))
  }, [id])

  useEffect(() => { setIsLogged(!!localStorage.getItem('kite_access_token')) }, [])

  async function checkAvailability() {
    if (!checkIn || !checkOut) {
      toast.error('Selecione check-in e check-out.')
      return
    }
    setChecking(true)
    setAvailabilityMsg(null)
    setAvailabilityOk(null)
    setTotalPrice(null)
    try {
      const res = await accommodationsApi.availability(id, { checkIn, checkOut, guests })
      const data = res.data?.data ?? res.data
      const available = data.available ?? data.isAvailable ?? true
      setAvailabilityOk(available)
      setAvailabilityMsg(available ? 'Disponível para estas datas!' : data.message ?? 'Indisponível para estas datas.')
      if (data.totalPrice != null) setTotalPrice(data.totalPrice)
      else if (available && acc) {
        const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
        setTotalPrice(nights * acc.pricePerNight + (acc.cleaningFee ?? 0))
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setAvailabilityMsg(msg ?? 'Erro ao verificar disponibilidade.')
      setAvailabilityOk(false)
    } finally {
      setChecking(false)
    }
  }

  async function handleBook() {
    if (!checkIn || !checkOut) {
      toast.error('Selecione as datas.')
      return
    }
    setBookingLoading(true)
    try {
      await accommodationsApi.book(id, { checkIn, checkOut, guests: parseInt(guests, 10) })
      toast.success('Reserva realizada com sucesso!')
      router.push('/hospedagem')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao reservar. Faça login e tente novamente.')
    } finally {
      setBookingLoading(false)
    }
  }

  if (!acc) {
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

  const images = normalizeImages(acc.images)
  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 0

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop mb-unit-xl pt-2">
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-unit-lg">
          <Link href="/hospedagem" className="hover:text-primary">
            Hospedagem
          </Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-on-surface truncate max-w-xs">{acc.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-unit-xl">
          <div className="flex-1 min-w-0">
            {/* Images carousel */}
            <div className="relative aspect-[16/10] rounded-card overflow-hidden bg-surface-container-low shadow-soft mb-3 photo-scrim">
              {images.length > 0 ? (
                <Image src={images[selectedImage] ?? images[0]} alt={acc.title} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-gradient opacity-30">
                  <Icon name="hotel" size={56} className="text-white" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 z-10 flex gap-2">
                <Badge variant="onphoto" className="capitalize">
                  {acc.type}
                </Badge>
              </div>
              <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm text-on-surface px-3 py-1.5 rounded-full text-price-display font-black">
                {formatPrice(acc.pricePerNight)}
                <span className="text-body-md font-normal text-secondary">/noite</span>
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

            <div className="card-soft p-6 md:p-8 mb-6">
              <h1 className="text-headline-lg font-display font-black text-primary mb-2">{acc.title}</h1>
              <div className="flex items-center gap-2 text-body-md text-secondary mb-4">
                <Icon name="location_on" size={16} />
                {acc.city}
                {acc.state ? `, ${acc.state}` : ''}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Hóspedes', value: acc.maxGuests, icon: 'group' },
                  { label: 'Quartos', value: acc.bedrooms, icon: 'bed' },
                  { label: 'Banheiros', value: acc.bathrooms, icon: 'bathtub' },
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

              {acc.amenities && acc.amenities.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-title-lg font-bold text-on-surface mb-3">Comodidades</h2>
                  <div className="flex flex-wrap gap-2">
                    {acc.amenities.map((am) => (
                      <span key={am} className="px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-fixed text-body-md font-semibold inline-flex items-center gap-1">
                        <Icon name="check" size={14} /> {am}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {acc.description && (
                <div>
                  <h2 className="text-title-lg font-bold text-on-surface mb-3">Sobre esta hospedagem</h2>
                  <div className="prose prose-sm max-w-none text-body-lg text-on-surface-variant leading-relaxed" dangerouslySetInnerHTML={{ __html: acc.description }} />
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-4 text-body-md text-secondary">
                {acc.minNights != null && (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="nights_stay" size={16} /> Mínimo {acc.minNights} noite{acc.minNights !== 1 ? 's' : ''}
                  </span>
                )}
                {acc.cleaningFee != null && acc.cleaningFee > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="cleaning_services" size={16} /> Taxa limpeza {formatPrice(acc.cleaningFee)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Booking sidebar — gated */}
          <aside className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-unit-md">
              {isLogged === null ? (
                <div className="card-soft p-6">
                  <div className="h-6 w-32 bg-surface-container animate-pulse rounded mb-4" />
                  <div className="h-10 bg-surface-container animate-pulse rounded-xl" />
                </div>
              ) : isLogged ? (
                <div className="card-soft p-6">
                  <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-1">Reserve sua estadia</h2>
                  <p className="text-body-md text-secondary mb-4">
                    {formatPrice(acc.pricePerNight)}
                    <span className="text-secondary">/noite</span> {acc.cleaningFee ? `+ ${formatPrice(acc.cleaningFee)} limpeza` : ''}
                  </p>

                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Check-in" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                      <Input label="Check-out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Hóspedes</label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-body-md focus:outline-none focus:border-primary cursor-pointer"
                      >
                        {Array.from({ length: acc.maxGuests ?? 6 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={String(n)}>
                            {n} hóspede{n > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button type="button" variant="secondary" onClick={checkAvailability} loading={checking} className="w-full">
                      <Icon name="search" size={18} />
                      Verificar disponibilidade
                    </Button>

                    {availabilityMsg && (
                      <div className={`rounded-xl px-4 py-3 text-body-md flex items-center gap-2 ${availabilityOk ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                        <Icon name={availabilityOk ? 'check_circle' : 'info'} size={18} />
                        {availabilityMsg}
                      </div>
                    )}

                    {nights > 0 && (
                      <div className="bg-surface-container-low rounded-xl p-4 text-body-md">
                        <div className="flex justify-between">
                          <span className="text-secondary">
                            {formatPrice(acc.pricePerNight)} × {nights} noite{nights > 1 ? 's' : ''}
                          </span>
                          <span className="font-bold">{formatPrice(acc.pricePerNight * nights)}</span>
                        </div>
                        {acc.cleaningFee ? (
                          <div className="flex justify-between mt-1">
                            <span className="text-secondary">Taxa de limpeza</span>
                            <span className="font-bold">{formatPrice(acc.cleaningFee)}</span>
                          </div>
                        ) : null}
                        <div className="border-t border-outline-variant mt-3 pt-3 flex justify-between text-title-lg font-black text-primary">
                          <span>Total</span>
                          <span>{formatPrice(totalPrice ?? acc.pricePerNight * nights + (acc.cleaningFee ?? 0))}</span>
                        </div>
                      </div>
                    )}

                    <Button onClick={handleBook} loading={bookingLoading} variant="accent" className="w-full" disabled={availabilityOk === false}>
                      <Icon name="event_available" size={18} />
                      Reservar agora
                    </Button>

                    <p className="text-label-md text-secondary text-center">Confirmação imediata • Cancelamento conforme política do anfitrião</p>
                  </div>
                </div>
              ) : (
                <div className="card-soft p-6 bg-brand-gradient text-white">
                  <p className="font-display font-black text-white flex items-center gap-2"><Icon name="lock" size={18} /> Entre para reservar</p>
                  <p className="text-white/80 text-body-md mt-1">Crie sua conta grátis e garanta sua estadia com confirmação imediata.</p>
                  <div className="flex gap-3 mt-4 flex-wrap">
                    <Link href="/login" className="bg-white text-primary px-5 py-2 rounded-full font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5"><Icon name="login" size={16} /> Entrar</Link>
                    <Link href="/cadastro" className="btn-accent px-5 py-2 rounded-full font-bold inline-flex items-center gap-1.5">Criar conta</Link>
                  </div>
                </div>
              )}

              {acc.host && (
                <div className="card-soft p-6">
                  <h3 className="text-label-md uppercase tracking-wider font-display font-bold text-on-surface-variant mb-3">Anfitrião</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold overflow-hidden">
                      {acc.host.avatar ? <img src={acc.host.avatar} alt={acc.host.name} className="w-full h-full object-cover" /> : acc.host.name[0].toUpperCase()}
                    </div>
                    <div className="text-body-md font-bold text-on-surface">{acc.host.name}</div>
                  </div>
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
