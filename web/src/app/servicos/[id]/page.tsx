'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { StarRating } from '@/components/ui/StarRating'
import { servicesApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type ServiceDetail = {
  id: string
  title: string
  description: string
  category: string
  pricingType: string
  price: number
  minHours?: number | null
  maxHours?: number | null
  city: string
  state: string
  images?: string[]
  seller: { id: string; name: string; avatar?: string; isVerified?: boolean; rating?: number; reviewCount?: number }
  rating?: number
  viewCount?: number
  createdAt?: string
}

export default function ServicoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [service, setService] = useState<ServiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  const [quantity, setQuantity] = useState('1')
  const [scheduledDate, setScheduledDate] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [ordering, setOrdering] = useState(false)
  const [isLogged, setIsLogged] = useState<boolean | null>(null)

  useEffect(() => {
    servicesApi.get(id)
      .then((r) => setService(r.data?.data ?? r.data))
      .catch(() => toast.error('Serviço não encontrado.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { setIsLogged(!!localStorage.getItem('kite_access_token')) }, [])

  const qtyNum = useMemo(() => {
    const n = parseFloat(quantity)
    return isNaN(n) || n <= 0 ? 0 : n
  }, [quantity])

  const totalPrice = useMemo(() => {
    if (!service) return 0
    return qtyNum * service.price
  }, [service, qtyNum])

  const isHourlyOrDaily = service?.pricingType === 'hourly' || service?.pricingType === 'daily'

  async function handleContratar() {
    if (!service) return
    let q = 1
    if (service.pricingType === 'fixed') {
      q = 1
    } else {
      q = parseFloat(quantity)
      if (isNaN(q) || q <= 0) { toast.error('Informe a quantidade de horas/diárias.'); return }
      if (service.minHours != null && q < service.minHours) { toast.error(`Mínimo ${service.minHours}h`); return }
      if (service.maxHours != null && q > service.maxHours) { toast.error(`Máximo ${service.maxHours}h`); return }
    }
    if (scheduledDate && isNaN(new Date(scheduledDate).getTime())) { toast.error('Data agendada inválida.'); return }

    setOrdering(true)
    try {
      await servicesApi.orders.create(service.id, {
        quantity: q,
        scheduledDate: scheduledDate || undefined,
        notes: notes.trim() || undefined,
        paymentMethod,
      })
      toast.success('Pedido criado com sucesso!')
      router.push('/servicos/pedidos')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao contratar. Faça login e tente novamente.')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    )
  }

  if (!service) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-20 text-center">
          <Icon name="handyman" size={48} className="text-outline-variant mb-4" />
          <h1 className="text-title-lg font-bold">Serviço não encontrado</h1>
          <Link href="/servicos" className="mt-4 inline-block text-primary font-bold hover:underline">Voltar para serviços</Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop mb-24 pt-2">
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-6">
          <Link href="/servicos" className="hover:text-primary">Serviços</Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-on-surface truncate max-w-xs">{service.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Images */}
            {(service.images && service.images.length > 0) && (
              <div className="mb-6">
                <div className="relative aspect-[16/10] rounded-card overflow-hidden bg-surface-container-low photo-scrim shadow-soft">
                  <Image src={service.images[selectedImage] ?? service.images[0]} alt={service.title} fill className="object-cover" priority sizes="(max-width:1024px) 100vw, 60vw" />
                  <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10 capitalize">{service.category}</Badge>
                  <Badge variant="verified" className="absolute top-3 left-3 z-10 capitalize">{service.pricingType === 'hourly' ? 'Por hora' : service.pricingType === 'daily' ? 'Por diária' : 'Preço fixo'}</Badge>
                </div>
                {service.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3">
                    {service.images.map((img, i) => (
                      <button key={i} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${i === selectedImage ? 'border-accent-strong' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="card-soft p-6 md:p-8 mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="verified" className="capitalize">{service.category}</Badge>
                <Badge variant="pending" className="capitalize">{service.pricingType}</Badge>
                <span className="inline-flex items-center gap-1 text-body-md text-secondary ml-2">
                  <Icon name="location_on" size={14} /> {service.city}, {service.state}
                </span>
              </div>

              <h1 className="text-headline-lg font-display font-black text-primary mb-3 leading-tight">{service.title}</h1>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-display-lg font-display font-black text-primary">{formatPrice(service.price)}</span>
                <span className="text-body-md text-secondary">{service.pricingType === 'hourly' ? '/ hora' : service.pricingType === 'daily' ? '/ dia' : ''}</span>
                {service.minHours != null && service.maxHours != null && service.pricingType === 'hourly' && (
                  <span className="ml-2 text-label-md bg-surface-container px-3 py-1 rounded-full font-bold text-secondary">{service.minHours}–{service.maxHours}h</span>
                )}
              </div>

              <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-3">Descrição</h2>
              <p className="text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-wrap">{service.description}</p>
            </div>

            {/* Seller card mobile */}
            <div className="card-soft p-6 lg:hidden">
              <h3 className="text-label-md uppercase tracking-wider font-display font-bold text-on-surface-variant mb-4">Prestador</h3>
              <Link href={`/vendedor/${service.seller.id}`} className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-on-primary font-bold overflow-hidden">
                  {service.seller.avatar ? <Image src={service.seller.avatar} alt={service.seller.name} width={48} height={48} className="w-full h-full object-cover" /> : service.seller.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-body-md font-bold text-on-surface group-hover:text-primary transition-colors">{service.seller.name}</span>
                    {service.seller.isVerified && <Icon name="verified" filled size={16} className="text-primary" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <StarRating value={service.seller.rating ?? service.rating ?? 0} size={14} />
                    <span className="text-label-md text-secondary">({service.seller.reviewCount ?? 0})</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Sidebar – contratação — gated */}
          <aside className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-4">
              {isLogged === null ? (
                <div className="card-soft p-6">
                  <div className="h-6 w-32 bg-surface-container animate-pulse rounded mb-4" />
                  <div className="h-10 bg-surface-container animate-pulse rounded-xl" />
                </div>
              ) : isLogged ? (
                <div className="card-soft p-6">
                  <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-5 flex items-center gap-2">
                    <Icon name="shopping_cart" size={20} className="text-primary" />
                    Contratar serviço
                  </h2>

                  <div className="flex flex-col gap-4">
                    {service.pricingType === 'fixed' ? (
                      <div className="bg-surface-container rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-body-md font-bold text-secondary">Quantidade</span>
                        <span className="text-body-md font-black text-on-surface">1 unidade · {formatPrice(service.price)}</span>
                      </div>
                    ) : (
                      <Input
                        label={`Quantidade (${service.pricingType === 'hourly' ? 'horas' : 'diárias'})${service.minHours != null && service.maxHours != null ? ` · ${service.minHours}–${service.maxHours}` : ''}`}
                        type="number"
                        min={service.minHours ?? 1}
                        max={service.maxHours ?? undefined}
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder={service.pricingType === 'hourly' ? 'Ex: 3' : 'Ex: 2'}
                      />
                    )}

                    <Input label="Data agendada (opcional)" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />

                    <Textarea label="Observações" placeholder="Detalhe o que precisa, local, preferências..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />

                    <Select
                      label="Forma de pagamento"
                      options={[
                        { value: 'pix', label: 'PIX' },
                        { value: 'card', label: 'Cartão' },
                        { value: 'free', label: 'Gratuito / combinar' },
                      ]}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />

                    <div className="bg-primary-fixed/40 dark:bg-primary-container/30 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-body-md font-bold text-on-surface">Total</span>
                      <span className="text-title-lg font-display font-black text-primary">{formatPrice(totalPrice || service.price)}</span>
                    </div>

                    <Button onClick={handleContratar} loading={ordering} variant="accent" className="w-full">
                      <Icon name="handshake" size={18} />
                      Contratar por {formatPrice(totalPrice || service.price)}
                    </Button>

                    <p className="text-label-md text-secondary text-center leading-relaxed">
                      Ao contratar você concorda com os termos. O prestador será notificado e confirmará o pedido.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="card-soft p-6 bg-brand-gradient text-white">
                  <p className="font-display font-black text-white flex items-center gap-2"><Icon name="lock" size={18} /> Entre para contratar este serviço</p>
                  <p className="text-white/80 text-body-md mt-1">Crie sua conta grátis e contrate com pagamento protegido.</p>
                  <div className="flex gap-3 mt-4 flex-wrap">
                    <Link href="/login" className="bg-white text-primary px-5 py-2 rounded-full font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5"><Icon name="login" size={16} /> Entrar</Link>
                    <Link href="/cadastro" className="btn-accent px-5 py-2 rounded-full font-bold inline-flex items-center gap-1.5">Criar conta</Link>
                  </div>
                  <div className="mt-4 bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-white/80 text-body-md">Total</span>
                    <span className="text-white font-black text-title-lg">{formatPrice(totalPrice || service.price)}</span>
                  </div>
                </div>
              )}

              {/* Seller card desktop */}
              <div className="card-soft p-6 hidden lg:block">
                <h3 className="text-label-md uppercase tracking-wider font-display font-bold text-on-surface-variant mb-4">Prestador</h3>
                <Link href={`/vendedor/${service.seller.id}`} className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-on-primary font-bold overflow-hidden">
                    {service.seller.avatar ? <Image src={service.seller.avatar} alt={service.seller.name} width={48} height={48} className="w-full h-full object-cover" /> : service.seller.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-md font-bold text-on-surface group-hover:text-primary transition-colors">{service.seller.name}</span>
                      {service.seller.isVerified && <Icon name="verified" filled size={16} className="text-primary" />}
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRating value={service.seller.rating ?? service.rating ?? 0} size={14} />
                      <span className="text-label-md text-secondary">({service.seller.reviewCount ?? 0})</span>
                    </div>
                  </div>
                </Link>
                <Link href={`/vendedor/${service.seller.id}`} className="mt-4 block">
                  <Button variant="ghost" className="w-full">Ver perfil</Button>
                </Link>
              </div>

              <div className="p-4 bg-primary-fixed dark:bg-primary-container rounded-xl text-label-md text-on-primary-fixed-variant dark:text-primary-fixed flex items-start gap-2">
                <Icon name="security" size={16} className="shrink-0 mt-0.5" />
                Pagamento protegido. Cancele conforme política do prestador.
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
