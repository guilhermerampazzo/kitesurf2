'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { eventsApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type Ticket = {
  id: string
  qrCode: string
  backupCode: string
  status: string
  holderName?: string | null
  holderEmail?: string | null
  ticketType: { id: string; name: string; price: number }
  ticketTypeId: string
}

type OrderItem = {
  id: string
  quantity: number
  unitPrice: number
  ticketType: { id: string; name: string; price: number }
}

type Order = {
  id: string
  totalAmount: number
  commissionAmount: number
  status: string
  paymentStatus: string
  paymentMethod?: string | null
  buyerInfo?: Record<string, unknown> | null
  createdAt: string
  event: { id: string; title: string; coverImage?: string | null; startDate: string; city: string; state: string; status: string }
  items: OrderItem[]
  tickets: Ticket[]
}

function statusBadge(status: string) {
  if (status === 'paid') return <Badge variant="success">Pago</Badge>
  if (status === 'pending') return <Badge variant="pending">Pendente</Badge>
  if (status === 'cancelled') return <Badge variant="error">Cancelado</Badge>
  if (status === 'refunded') return <Badge variant="error">Reembolsado</Badge>
  return <Badge variant="pending">{status}</Badge>
}

function ticketStatusBadge(status: string) {
  if (status === 'valid') return <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-label-md font-bold"><Icon name="check_circle" size={12}/> Válido</span>
  if (status === 'used') return <span className="inline-flex items-center gap-1 text-secondary bg-surface-container px-2 py-0.5 rounded-full text-label-md font-bold"><Icon name="done_all" size={12}/> Usado</span>
  if (status === 'cancelled') return <span className="inline-flex items-center gap-1 text-error bg-error-container px-2 py-0.5 rounded-full text-label-md font-bold"><Icon name="block" size={12}/> Cancelado</span>
  return <Badge variant="pending">{status}</Badge>
}

export default function MeusIngressosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  async function load() {
    setLoading(true)
    try {
      const res = await eventsApi.myOrders()
      const data = Array.isArray(res.data) ? res.data : res.data.data ?? res.data
      setOrders((data as Order[]) ?? [])
    } catch {
      toast.error('Erro ao carregar seus ingressos.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-16">
        <SectionHeading
          title={<>Meus <span className="accent-word">ingressos</span></>}
          subtitle="Seus pedidos e ingressos — apresente o QR ou código backup no check-in."
          actionLabel="Explorar eventos"
          actionHref="/eventos"
        />

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon="confirmation_number"
            title="Nenhum ingresso ainda"
            description="Compre ingressos para eventos e eles aparecerão aqui com QR e código backup."
            actionLabel="Ver eventos"
            actionHref="/eventos"
          />
        ) : (
          <div className="flex flex-col gap-6">
            {orders.map((order) => {
              const isExpanded = expanded[order.id]
              const eventDate = new Date(order.event.startDate)
              return (
                <div key={order.id} className="card-soft overflow-hidden">
                  {/* Header */}
                  <div className="p-5 flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-28 h-20 rounded-xl overflow-hidden bg-surface-container-low shrink-0">
                      {order.event.coverImage ? (
                        <Image src={order.event.coverImage} alt={order.event.title} width={112} height={80} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="event" size={28} className="text-outline-variant" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/eventos/${order.event.id}`} className="text-title-lg font-display font-extrabold text-on-surface hover:text-primary line-clamp-2">{order.event.title}</Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-body-md text-secondary">
                        <span className="inline-flex items-center gap-1"><Icon name="calendar_today" size={14}/> {eventDate.toLocaleDateString('pt-BR')} · {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="w-1 h-1 bg-outline-variant rounded-full"/>
                        <span className="inline-flex items-center gap-1"><Icon name="location_on" size={14}/> {order.event.city}, {order.event.state}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {statusBadge(order.status)}
                        <Badge variant={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'pending' ? 'pending' : 'error'}>{order.paymentStatus === 'paid' ? 'Pagamento pago' : order.paymentStatus === 'pending' ? 'Pagamento pendente' : order.paymentStatus}</Badge>
                        {order.paymentMethod && <Badge variant="pending" className="capitalize">{order.paymentMethod}</Badge>}
                        <span className="text-label-md text-secondary">Pedido #{order.id.slice(0,8)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <div className="text-price-display font-display font-black text-primary">{order.totalAmount === 0 ? 'Grátis' : formatPrice(order.totalAmount)}</div>
                      <div className="text-label-md text-secondary">{order.items.reduce((a,b)=>a+b.quantity,0)} ingresso(s) · {order.tickets.length} ticket(s)</div>
                      <div className="flex gap-2">
                        <Link href={`/eventos/${order.event.id}`}><Button variant="ghost" size="sm"><Icon name="visibility" size={16}/> Evento</Button></Link>
                        <Button variant="ghost" size="sm" onClick={() => toggle(order.id)}><Icon name={isExpanded ? 'expand_less' : 'expand_more'} size={16}/> {isExpanded ? 'Ocultar' : 'Ver ingressos'}</Button>
                      </div>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="px-5 py-3 bg-surface-container-low flex flex-wrap gap-2 border-y border-outline-variant">
                    {order.items.map((it) => (
                      <span key={it.id} className="inline-flex items-center gap-1 text-body-md bg-surface-container-lowest border border-outline-variant rounded-full px-3 py-1">
                        <Icon name="local_activity" size={14} className="text-primary"/> {it.ticketType.name} × {it.quantity} · {formatPrice(it.unitPrice)}
                      </span>
                    ))}
                  </div>

                  {/* Tickets detail */}
                  {isExpanded && (
                    <div className="p-5 bg-surface-container-low/50">
                      <h3 className="text-title-lg font-display font-extrabold text-on-surface mb-3 flex items-center gap-2"><Icon name="qr_code" size={20}/> Ingressos ({order.tickets.length})</h3>
                      {order.tickets.length === 0 ? (
                        <p className="text-body-md text-secondary">Tickets serão gerados após confirmação do pagamento.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {order.tickets.map((t) => (
                            <div key={t.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="text-body-md font-display font-extrabold text-on-surface">{t.ticketType.name}</span>
                                {ticketStatusBadge(t.status)}
                              </div>
                              {t.holderName && <div className="text-body-md text-secondary inline-flex items-center gap-1"><Icon name="person" size={14}/> {t.holderName} {t.holderEmail ? `· ${t.holderEmail}` : ''}</div>}
                              <div className="space-y-2">
                                <div>
                                  <div className="text-label-md font-bold uppercase tracking-wider text-secondary">QR Code</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <code className="flex-1 text-[11px] bg-surface-container border border-outline-variant rounded-lg px-2 py-2 break-all">{t.qrCode}</code>
                                    <button onClick={() => copy(t.qrCode, 'QR')} className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:scale-105 transition-transform shrink-0">
                                      <Icon name="content_copy" size={16}/>
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-label-md font-bold uppercase tracking-wider text-secondary flex items-center gap-1"><Icon name="vpn_key" size={12}/> Código backup</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <code className="text-lg font-display font-black tracking-widest bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl">{t.backupCode}</code>
                                    <button onClick={() => copy(t.backupCode, 'Código backup')} className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center hover:scale-105 transition-transform shrink-0">
                                      <Icon name="content_copy" size={16}/>
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-secondary mt-1">Use se o QR falhar no portão.</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 p-3 bg-primary-fixed/20 border border-primary-fixed rounded-xl text-body-md text-on-primary-fixed-variant flex items-start gap-2">
                        <Icon name="info" size={18} className="shrink-0 mt-0.5"/>
                        Apresente um dos códigos no check-in. Cada ingresso só pode ser usado uma vez. Compartilhar o QR com terceiros pode invalidar seu acesso.
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
