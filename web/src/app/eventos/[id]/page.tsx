'use client'
import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { eventsApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import DOMPurify from 'dompurify'
import toast from 'react-hot-toast'

const MapView = dynamic(() => import('@/components/ui/MapView'), { ssr: false })

type TicketType = {
  id: string
  name: string
  description?: string | null
  price: number
  quantity: number
  sold: number
  remaining?: number
  maxPerUser: number
  salesStart?: string | null
  salesEnd?: string | null
  requiresInfo?: string[] | null
  status: string
}

type EventDetail = {
  id: string
  title: string
  description: string
  coverImage?: string | null
  images: string[]
  category: string
  type: string
  city: string
  state: string
  address?: string | null
  venue?: string | null
  lat?: number | null
  lng?: number | null
  startDate: string
  endDate?: string | null
  startTime?: string | null
  organizerId: string
  organizer: { id: string; name: string; avatar?: string | null; isVerified?: boolean; rating?: number; reviewCount?: number }
  organizerName?: string | null
  socialLinks?: Record<string, string> | null
  status: string
  isFeatured: boolean
  featuredPaid: boolean
  featuredExpiresAt?: string | null
  maxAttendees?: number | null
  viewCount: number
  ticketTypes: TicketType[]
}

function Countdown({ startDate, endDate }: { startDate: string; endDate?: string | null }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const start = new Date(startDate).getTime()
  const end = endDate ? new Date(endDate).getTime() : null
  const diff = start - now
  const hasStarted = diff <= 0
  const hasEnded = end ? now > end : false

  if (hasEnded) return <span className="inline-flex items-center gap-1 text-error font-bold"><Icon name="event_busy" size={16} /> Encerrado</span>
  if (hasStarted) return <span className="inline-flex items-center gap-1 text-green-700 font-bold"><Icon name="play_circle" size={16} /> Em andamento</span>

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  return (
    <div className="flex items-center gap-2 font-display font-black text-primary">
      <Icon name="timer" size={20} className="text-accent-strong" />
      <span className="inline-flex gap-1">
        {days > 0 && <span className="bg-primary-fixed px-2 py-1 rounded-lg text-on-primary-fixed-variant">{days}d</span>}
        <span className="bg-primary-fixed px-2 py-1 rounded-lg text-on-primary-fixed-variant">{String(hours).padStart(2, '0')}h</span>
        <span className="bg-primary-fixed px-2 py-1 rounded-lg text-on-primary-fixed-variant">{String(minutes).padStart(2, '0')}m</span>
        <span className="bg-primary-fixed px-2 py-1 rounded-lg text-on-primary-fixed-variant">{String(seconds).padStart(2, '0')}s</span>
      </span>
    </div>
  )
}

function isSalesOpen(tt: TicketType): { open: boolean; reason?: string } {
  const now = new Date()
  if (tt.status !== 'active') return { open: false, reason: tt.status === 'sold_out' ? 'Esgotado' : 'Pausado' }
  if (tt.salesStart && now < new Date(tt.salesStart)) return { open: false, reason: `Vendas a partir de ${new Date(tt.salesStart).toLocaleDateString('pt-BR')}` }
  if (tt.salesEnd && now > new Date(tt.salesEnd)) return { open: false, reason: 'Vendas encerradas' }
  if ((tt.remaining ?? tt.quantity - tt.sold) <= 0) return { open: false, reason: 'Esgotado' }
  return { open: true }
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [buyerInfo, setBuyerInfo] = useState({ name: '', email: '', phone: '', document: '' })
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'free'>('pix')
  const [orderLoading, setOrderLoading] = useState(false)
  const [featuredLoading, setFeaturedLoading] = useState(false)
  // attendeeInfo per ticketTypeId -> array of objects per ticket
  const [attendeeInfos, setAttendeeInfos] = useState<Record<string, Array<Record<string, string>>>>({})

  useEffect(() => {
    eventsApi.get(id)
      .then((r) => setEvent(r.data as EventDetail))
      .catch(() => toast.error('Evento não encontrado.'))
      .finally(() => setLoading(false))
  }, [id])

  const total = useMemo(() => {
    if (!event) return 0
    return event.ticketTypes.reduce((sum, tt) => sum + (quantities[tt.id] ?? 0) * tt.price, 0)
  }, [event, quantities])

  const hasSelection = useMemo(() => Object.values(quantities).some((q) => q > 0), [quantities])

  function updateQuantity(tt: TicketType, delta: number) {
    const current = quantities[tt.id] ?? 0
    const remaining = tt.remaining ?? tt.quantity - tt.sold
    const max = Math.min(remaining, tt.maxPerUser)
    let next = current + delta
    if (next < 0) next = 0
    if (next > max) {
      toast.error(`Máximo ${max} por pessoa para ${tt.name}`)
      next = max
    }
    setQuantities((prev) => ({ ...prev, [tt.id]: next }))
    // sync attendeeInfos
    setAttendeeInfos((prev) => {
      const arr = prev[tt.id] ?? []
      if (next > arr.length) {
        const extended = [...arr]
        for (let i = arr.length; i < next; i++) extended.push({})
        return { ...prev, [tt.id]: extended }
      }
      if (next < arr.length) {
        return { ...prev, [tt.id]: arr.slice(0, next) }
      }
      return prev
    })
  }

  function setAttendeeField(ttId: string, index: number, field: string, value: string) {
    setAttendeeInfos((prev) => {
      const arr = [...(prev[ttId] ?? [])]
      arr[index] = { ...(arr[index] ?? {}), [field]: value }
      return { ...prev, [ttId]: arr }
    })
  }

  async function handlePayFeatured() {
    if (!event) return
    setFeaturedLoading(true)
    try {
      const { data } = await eventsApi.payFeatured(event.id, { method: paymentMethod === 'card' ? 'card' : 'pix' })
      toast.success('Pagamento destaque criado. Verifique seu e-mail/pix.')
      // data may contain pixQrCode etc, we can show? just toast
      console.log('featured payment', data)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao pagar destaque.')
    } finally { setFeaturedLoading(false) }
  }

  async function handleBuy() {
    if (!event) return
    if (!hasSelection) { toast.error('Selecione ao menos 1 ingresso.'); return }
    if (!buyerInfo.name.trim() || !buyerInfo.email.trim()) { toast.error('Preencha nome e e-mail.'); return }
    // validate attendee required
    for (const tt of event.ticketTypes) {
      const qty = quantities[tt.id] ?? 0
      if (qty === 0) continue
      const req = tt.requiresInfo ?? []
      if (req.length > 0) {
        const infos = attendeeInfos[tt.id] ?? []
        for (let i = 0; i < qty; i++) {
          const info = infos[i] ?? {}
          for (const field of req) {
            const val = (info[field] ?? '').toString().trim()
            if (!val) {
              toast.error(`Preencha "${field}" para ingresso ${tt.name} #${i+1}`)
              return
            }
          }
        }
      }
    }

    const items = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([ticketTypeId, quantity]) => ({
        ticketTypeId,
        quantity,
        attendeeInfo: attendeeInfos[ticketTypeId] ?? undefined,
      }))

    const method = total === 0 ? 'free' : paymentMethod
    setOrderLoading(true)
    try {
      const { data } = await eventsApi.createOrder(event.id, {
        items,
        buyerInfo,
        paymentMethod: method,
      })
      toast.success(total === 0 ? 'Inscrição gratuita confirmada!' : 'Pedido criado com sucesso!')
      // data contains order, payment, tickets
      console.log('order', data)
      router.push('/eventos/meus-ingressos')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao comprar ingressos.')
    } finally { setOrderLoading(false) }
  }

  function shareWhatsApp() {
    if (!event) return
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = `Confira este evento: ${event.title} - ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }
  function shareCopy() {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copiado!')
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-12 flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    )
  }

  if (!event) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-12 text-center">
          <Icon name="event_busy" size={48} className="text-outline-variant mx-auto mb-4" />
          <h1 className="text-headline-lg font-display font-black text-primary">Evento não encontrado</h1>
          <Link href="/eventos" className="inline-flex mt-6"><Button>Voltar aos eventos</Button></Link>
        </main>
        <Footer />
      </>
    )
  }

  const safeDescription = typeof window !== 'undefined'
    ? DOMPurify.sanitize(event.description, { ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li','h1','h2','h3','img','a','blockquote'], ALLOWED_ATTR: ['src','alt','class','href','target','rel'] })
    : event.description

  const cheapest = event.ticketTypes.length ? Math.min(...event.ticketTypes.map(t => t.price)) : null
  const showFeaturedPay = event.type === 'destaque' && !event.isFeatured && !event.featuredPaid

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-4 flex-wrap">
          <Link href="/" className="hover:text-primary">Home</Link>
          <Icon name="chevron_right" size={16} />
          <Link href="/eventos" className="hover:text-primary">Eventos</Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-on-surface truncate max-w-xs">{event.title}</span>
        </nav>

        {/* Cover */}
        <div className="relative rounded-card overflow-hidden bg-surface-container-low mb-6 shadow-soft">
          <div className="aspect-[16/6] relative">
            {event.coverImage ? (
              <Image src={event.coverImage} alt={event.title} fill className="object-cover" priority />
            ) : event.images[0] ? (
              <Image src={event.images[0]} alt={event.title} fill className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon name="event" size={64} className="text-outline-variant" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant={event.type === 'oficial' ? 'verified' : event.type === 'destaque' ? 'sponsored' : 'pending'} className="capitalize">{event.type}</Badge>
                <Badge variant="onphoto" className="capitalize">{event.category}</Badge>
                {event.isFeatured && <span className="inline-flex items-center gap-1 bg-amber-400 text-white px-3 py-1 rounded-full text-xs font-display font-extrabold"><Icon name="star" filled size={14}/> Destaque</span>}
                <span className="ml-auto inline-flex items-center gap-1 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-body-md"><Icon name="visibility" size={16}/> {event.viewCount}</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-display font-black leading-tight">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-white/80 text-body-md">
                <span className="inline-flex items-center gap-1"><Icon name="location_on" size={16}/> {event.city}, {event.state}</span>
                {event.venue && <><span className="w-1 h-1 bg-white/50 rounded-full"/><span className="inline-flex items-center gap-1"><Icon name="place" size={16}/> {event.venue}</span></>}
                <span className="w-1 h-1 bg-white/50 rounded-full"/><span className="inline-flex items-center gap-1"><Icon name="calendar_today" size={16}/> {new Date(event.startDate).toLocaleDateString('pt-BR')} {event.startTime ? `às ${event.startTime}` : ''}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Countdown + share */}
            <div className="card-soft p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <Countdown startDate={event.startDate} endDate={event.endDate} />
              <div className="flex items-center gap-2">
                <span className="text-label-md font-bold uppercase tracking-wider text-secondary hidden md:inline">Compartilhar:</span>
                <button onClick={shareWhatsApp} className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-110 transition-transform" aria-label="WhatsApp"><Icon name="share" size={16}/></button>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform"><Icon name="public" size={16}/></a>
                <button onClick={shareCopy} className="w-9 h-9 rounded-full bg-surface-container text-secondary flex items-center justify-center hover:bg-surface-container-high transition-colors"><Icon name="link" size={16}/></button>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 transition-transform"><Icon name="alternate_email" size={16}/></a>
              </div>
            </div>

            {/* Featured pay banner */}
            {showFeaturedPay && (
              <div className="card-soft p-5 border-amber-200 bg-amber-50 dark:bg-amber-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-2"><Icon name="star" filled size={18}/> Evento destaque pendente</h3>
                  <p className="text-body-md text-amber-700 dark:text-amber-200">Pague <strong>R$ 99,90</strong> (pagamento único) para ativar o destaque por 30 dias e ganhar prioridade na listagem.</p>
                </div>
                <Button variant="accent" onClick={handlePayFeatured} loading={featuredLoading} className="shrink-0">
                  <Icon name="payments" size={18}/> Pagar destaque R$ 99,90
                </Button>
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card-soft p-4 flex items-center gap-3">
                <span className="trust-chip-icon shrink-0"><Icon name="calendar_month" size={22}/></span>
                <div>
                  <div className="text-label-md uppercase tracking-wider font-bold text-secondary">Início</div>
                  <div className="text-body-md font-bold text-on-surface">{new Date(event.startDate).toLocaleDateString('pt-BR')} {event.startTime ? `· ${event.startTime}` : ''}</div>
                  {event.endDate && <div className="text-body-md text-secondary">até {new Date(event.endDate).toLocaleDateString('pt-BR')}</div>}
                </div>
              </div>
              <div className="card-soft p-4 flex items-center gap-3">
                <span className="trust-chip-icon shrink-0"><Icon name="location_on" size={22}/></span>
                <div>
                  <div className="text-label-md uppercase tracking-wider font-bold text-secondary">Local</div>
                  <div className="text-body-md font-bold text-on-surface">{event.venue ?? event.city}</div>
                  <div className="text-body-md text-secondary">{event.address ? `${event.address} · ` : ''}{event.city}, {event.state}</div>
                </div>
              </div>
              <div className="card-soft p-4 flex items-center gap-3">
                <span className="trust-chip-icon shrink-0"><Icon name="confirmation_number" size={22}/></span>
                <div>
                  <div className="text-label-md uppercase tracking-wider font-bold text-secondary">Ingressos</div>
                  <div className="text-body-md font-bold text-on-surface">{event.ticketTypes.length} tipos</div>
                  <div className="text-body-md text-secondary">{cheapest != null ? (cheapest === 0 ? 'Grátis disponível' : `a partir de ${formatPrice(cheapest)}`) : 'Consultar'}</div>
                </div>
              </div>
            </div>

            {/* Organizer */}
            <div className="card-soft p-6">
              <h3 className="text-label-md uppercase tracking-wider font-display font-bold text-on-surface-variant mb-3">Organizador</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold overflow-hidden">
                  {event.organizer.avatar ? <Image src={event.organizer.avatar} alt={event.organizer.name} width={48} height={48} className="w-full h-full object-cover"/> : event.organizer.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/vendedor/${event.organizer.id}`} className="text-body-md font-bold text-on-surface hover:text-primary">{event.organizerName ?? event.organizer.name}</Link>
                    {event.organizer.isVerified && <Icon name="verified" filled size={16} className="text-primary"/>}
                  </div>
                  {event.organizer.rating != null && (
                    <div className="flex items-center gap-1 text-label-md text-secondary">
                      <Icon name="star" filled size={12} className="text-amber-400"/> {event.organizer.rating.toFixed(1)} ({event.organizer.reviewCount ?? 0})
                    </div>
                  )}
                </div>
              </div>
              {event.socialLinks && Object.keys(event.socialLinks).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {event.socialLinks.instagram && <a href={event.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#F58529] to-[#DD2A7B] text-white text-body-md font-bold"><Icon name="photo_camera" size={14}/> Instagram</a>}
                  {event.socialLinks.facebook && <a href={event.socialLinks.facebook} target="_blank" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1877F2] text-white text-body-md font-bold"><Icon name="public" size={14}/> Facebook</a>}
                  {event.socialLinks.whatsapp && <a href={event.socialLinks.whatsapp} target="_blank" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500 text-white text-body-md font-bold"><Icon name="chat" size={14}/> WhatsApp</a>}
                  {event.socialLinks.site && <a href={event.socialLinks.site} target="_blank" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant text-body-md font-bold"><Icon name="language" size={14}/> Site</a>}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="card-soft p-6">
              <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-4">Sobre o evento</h2>
              <div className="prose max-w-none text-body-lg text-on-surface-variant leading-relaxed" dangerouslySetInnerHTML={{ __html: safeDescription }} />
            </div>

            {/* Map */}
            {event.lat != null && event.lng != null && (
              <div className="card-soft p-6">
                <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-3">Localização</h2>
                <p className="text-body-md text-secondary mb-3">{event.address ?? `${event.venue ?? ''} ${event.city}, ${event.state}`}</p>
                <MapView lat={event.lat} lng={event.lng} label={event.venue ?? event.title} />
              </div>
            )}

            {/* Images gallery */}
            {event.images.length > 1 && (
              <div className="card-soft p-6">
                <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-3">Galeria</h2>
                <div className="grid grid-cols-3 gap-3">
                  {event.images.map((img, i) => (
                    <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-low">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Checkout */}
          <aside className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-4">
              <div className="card-soft p-6">
                <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-1">Ingressos</h2>
                <p className="text-body-md text-secondary mb-4">Escolha a quantidade e finalize a compra.</p>

                {event.ticketTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon name="confirmation_number" size={40} className="text-outline-variant mx-auto mb-2"/>
                    <p className="text-body-md text-secondary">Nenhum ingresso disponível ainda.</p>
                    <p className="text-body-md text-primary font-bold mt-2">Em breve</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {event.ticketTypes.map((tt) => {
                      const qty = quantities[tt.id] ?? 0
                      const sales = isSalesOpen(tt)
                      const remaining = tt.remaining ?? tt.quantity - tt.sold
                      return (
                        <div key={tt.id} className={`border rounded-2xl p-4 ${sales.open ? 'border-outline-variant bg-surface-container-lowest' : 'border-outline-variant bg-surface-container opacity-75'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="text-body-md font-display font-extrabold text-on-surface">{tt.name}</div>
                              {tt.description && <div className="text-body-md text-secondary mt-0.5">{tt.description}</div>}
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-price-display font-black ${tt.price === 0 ? 'text-green-700' : 'text-primary'}`}>{tt.price === 0 ? 'Grátis' : formatPrice(tt.price)}</span>
                                <span className="text-label-md text-secondary">· {remaining} restantes</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {tt.salesStart && <span className="text-[11px] px-2 py-0.5 bg-surface-container rounded-full">Início: {new Date(tt.salesStart).toLocaleDateString('pt-BR')}</span>}
                                {tt.salesEnd && <span className="text-[11px] px-2 py-0.5 bg-surface-container rounded-full">Fim: {new Date(tt.salesEnd).toLocaleDateString('pt-BR')}</span>}
                                {tt.requiresInfo && tt.requiresInfo.length > 0 && <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full inline-flex items-center gap-1"><Icon name="badge" size={10}/> requer dados</span>}
                              </div>
                              {!sales.open && <div className="text-label-md text-error font-bold mt-2 inline-flex items-center gap-1"><Icon name="block" size={14}/>{sales.reason}</div>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => updateQuantity(tt, -1)} disabled={!sales.open || qty === 0} className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary disabled:opacity-40"><Icon name="remove" size={16}/></button>
                              <span className="w-8 text-center font-display font-black text-on-surface">{qty}</span>
                              <button onClick={() => updateQuantity(tt, 1)} disabled={!sales.open} className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container disabled:opacity-40"><Icon name="add" size={16}/></button>
                            </div>
                          </div>

                          {/* Attendee info per ticket */}
                          {qty > 0 && tt.requiresInfo && tt.requiresInfo.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-outline-variant space-y-3">
                              <div className="text-label-md font-bold uppercase tracking-wider text-secondary">Dados dos participantes — {tt.name}</div>
                              {Array.from({ length: qty }).map((_, idx) => (
                                <div key={idx} className="bg-surface-container-low rounded-xl p-3 space-y-2">
                                  <div className="text-body-md font-bold text-on-surface">Ingresso #{idx + 1}</div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {tt.requiresInfo!.map((field) => (
                                      <Input
                                        key={field}
                                        label={field}
                                        placeholder={`Informe ${field}`}
                                        value={attendeeInfos[tt.id]?.[idx]?.[field] ?? ''}
                                        onChange={(e) => setAttendeeField(tt.id, idx, field, e.target.value)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Buyer info */}
                <div className="mt-6 pt-6 border-t border-outline-variant">
                  <h3 className="text-title-lg font-bold text-on-surface mb-3">Seus dados</h3>
                  <div className="flex flex-col gap-3">
                    <Input label="Nome completo" placeholder="Seu nome" value={buyerInfo.name} onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })} required icon="person" />
                    <Input label="E-mail" type="email" placeholder="seu@email.com" value={buyerInfo.email} onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })} required icon="mail" />
                    <Input label="Telefone / WhatsApp" placeholder="(85) 99999-9999" value={buyerInfo.phone} onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })} icon="phone" />
                    <Input label="CPF (opcional)" placeholder="000.000.000-00" value={buyerInfo.document} onChange={(e) => setBuyerInfo({ ...buyerInfo, document: e.target.value })} icon="badge" />
                  </div>
                </div>

                {/* Payment method */}
                <div className="mt-6">
                  <label className="text-label-md font-display font-bold uppercase tracking-wider text-on-surface-variant">Forma de pagamento</label>
                  <Select
                    label=""
                    options={[
                      { value: 'pix', label: 'PIX' },
                      { value: 'card', label: 'Cartão' },
                      { value: 'free', label: 'Grátis (quando total zero)' },
                    ]}
                    value={total === 0 ? 'free' : paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as never)}
                  />
                  {total === 0 && <p className="text-label-md text-green-700 mt-1 font-semibold">Ingressos gratuitos — sem cobrança.</p>}
                </div>

                {/* Total + buy */}
                <div className="mt-6 bg-surface-container-low rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-body-md text-secondary">Total</span>
                    <span className="text-price-display font-display font-black text-primary">{total === 0 ? 'Grátis' : formatPrice(total)}</span>
                  </div>
                  {hasSelection && <div className="text-label-md text-secondary">{Object.values(quantities).reduce((a,b)=>a+b,0)} ingresso(s)</div>}
                </div>

                <Button onClick={handleBuy} loading={orderLoading} disabled={!hasSelection} className="w-full mt-4" size="lg" variant="accent">
                  <Icon name="shopping_cart" size={18} />
                  {total === 0 ? 'Garantir ingressos gratuitos' : `Comprar · ${formatPrice(total)}`}
                </Button>
                <p className="text-[11px] text-secondary text-center mt-2">Ao comprar você concorda com os termos do evento. Pagamento seguro via KITE360º.</p>

                {/* Organizer actions */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Link href={`/eventos/${event.id}/ingressos`}><Button variant="ghost" size="sm" className="w-full"><Icon name="settings" size={16}/> Gerenciar ingressos</Button></Link>
                  <Link href={`/eventos/${event.id}/checkin`}><Button variant="ghost" size="sm" className="w-full"><Icon name="qr_code_scanner" size={16}/> Check-in</Button></Link>
                </div>
              </div>

              <div className="card-soft p-4">
                <h3 className="text-body-md font-bold text-on-surface mb-2 flex items-center gap-2"><Icon name="info" size={16} className="text-primary"/> Dúvidas?</h3>
                <p className="text-body-md text-secondary">Após a compra, seus ingressos com QR e código backup estarão em <Link href="/eventos/meus-ingressos" className="text-primary font-bold hover:underline">Meus ingressos</Link>.</p>
                <Link href="/eventos/meus-ingressos" className="mt-3 inline-flex w-full"><Button variant="ghost" size="sm" className="w-full"><Icon name="confirmation_number" size={16}/> Ver meus ingressos</Button></Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
