'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { servicesApi } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type Order = {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: string
  paymentStatus?: string
  scheduledDate?: string
  notes?: string
  createdAt?: string
  service: { id: string; title: string; price?: number; city?: string; state?: string; images?: string[] }
  buyer?: { id: string; name: string; avatar?: string }
  seller?: { id: string; name: string; avatar?: string }
}

function statusVariant(s: string): 'pending' | 'success' | 'error' | 'verified' | 'new' | 'used' {
  if (s === 'pending') return 'pending'
  if (s === 'confirmed') return 'verified'
  if (s === 'in_progress') return 'new'
  if (s === 'completed') return 'success'
  if (s === 'cancelled') return 'error'
  if (s === 'refunded') return 'error'
  return 'pending'
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    in_progress: 'Em andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
  }
  return map[s] ?? s
}

export default function ServicosPedidosPage() {
  const [activeTab, setActiveTab] = useState<'mine' | 'received'>('mine')
  const [mine, setMine] = useState<Order[]>([])
  const [received, setReceived] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [mRes, rRes] = await Promise.all([
          servicesApi.orders.mine(),
          servicesApi.orders.received(),
        ])
        const mData = mRes.data?.data ?? mRes.data ?? []
        const rData = rRes.data?.data ?? rRes.data ?? []
        setMine(Array.isArray(mData) ? mData : [])
        setReceived(Array.isArray(rData) ? rData : [])
      } catch {
        toast.error('Erro ao carregar pedidos. Faça login.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const list = activeTab === 'mine' ? mine : received

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-headline-lg font-display font-black text-primary flex items-center gap-2">
                <Icon name="receipt_long" size={28} className="text-primary" />
                Pedidos de <span className="accent-word">Serviços</span>
              </h1>
              <p className="text-body-md text-secondary mt-1">Acompanhe contratações feitas e recebidas.</p>
            </div>
            <Link href="/servicos" className="inline-flex items-center gap-2 text-body-md font-bold text-primary hover:text-accent-strong transition-colors">
              <Icon name="store" size={18} />
              Ver serviços
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 p-1 bg-surface-container rounded-full w-fit">
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-6 py-2.5 rounded-full text-body-md font-display font-bold transition-colors inline-flex items-center gap-2 ${activeTab === 'mine' ? 'bg-brand-gradient text-white shadow-soft' : 'text-secondary hover:text-primary'}`}
            >
              <Icon name="shopping_bag" size={18} filled={activeTab === 'mine'} />
              Como comprador
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${activeTab === 'mine' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-secondary'}`}>{mine.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-6 py-2.5 rounded-full text-body-md font-display font-bold transition-colors inline-flex items-center gap-2 ${activeTab === 'received' ? 'bg-brand-gradient text-white shadow-soft' : 'text-secondary hover:text-primary'}`}
            >
              <Icon name="sell" size={18} filled={activeTab === 'received'} />
              Como vendedor
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${activeTab === 'received' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-secondary'}`}>{received.length}</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="card-soft p-12 text-center">
              <div className="trust-chip-icon !w-16 !h-16 mx-auto mb-4">
                <Icon name="receipt_long" size={32} />
              </div>
              <h3 className="text-title-lg font-display font-extrabold text-on-surface mb-2">
                {activeTab === 'mine' ? 'Você ainda não contratou serviços' : 'Nenhum pedido recebido'}
              </h3>
              <p className="text-body-md text-secondary max-w-md mx-auto mb-6">
                {activeTab === 'mine' ? 'Explore serviços e contrate profissionais verificados com segurança.' : 'Quando alguém contratar seus serviços, os pedidos aparecerão aqui.'}
              </p>
              <Link href="/servicos" className="inline-flex items-center gap-2 bg-brand-gradient text-white font-display font-bold px-6 py-2.5 rounded-full hover:shadow-float transition-shadow">
                Explorar serviços
                <Icon name="arrow_forward" size={18} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {list.map((o) => (
                <div key={o.id} className="card-soft p-5 md:p-6 flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Link href={`/servicos/${o.service.id}`} className="text-title-lg font-display font-extrabold text-primary hover:text-accent-strong transition-colors line-clamp-2">
                        {o.service.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-body-md text-secondary">
                        <Badge variant={statusVariant(o.status)}>{statusLabel(o.status)}</Badge>
                        {o.paymentStatus && <Badge variant={o.paymentStatus === 'paid' ? 'success' : o.paymentStatus === 'refunded' ? 'error' : 'pending'} className="capitalize">{o.paymentStatus}</Badge>}
                        <span className="inline-flex items-center gap-1"><Icon name="tag" size={14} /> {o.quantity}× {formatPrice(o.unitPrice)}</span>
                        {o.scheduledDate && <span className="inline-flex items-center gap-1"><Icon name="calendar_today" size={14} /> {formatDate(o.scheduledDate)}</span>}
                        {o.createdAt && <span className="inline-flex items-center gap-1"><Icon name="schedule" size={14} /> {formatDate(o.createdAt)}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-price-display font-display font-black text-primary">{formatPrice(o.totalPrice)}</div>
                      <div className="text-label-md text-secondary">Total</div>
                    </div>
                  </div>

                  {o.notes && (
                    <div className="bg-surface-container rounded-xl px-4 py-3 text-body-md text-on-surface-variant">
                      <span className="font-bold text-on-surface">Observações:</span> {o.notes}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-outline-variant text-body-md">
                    {activeTab === 'mine' ? (
                      <span className="inline-flex items-center gap-2">
                        <Icon name="person" size={16} className="text-secondary" />
                        Prestador: <span className="font-bold text-on-surface">{o.seller?.name ?? '—'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Icon name="person" size={16} className="text-secondary" />
                        Comprador: <span className="font-bold text-on-surface">{o.buyer?.name ?? '—'}</span>
                      </span>
                    )}
                    <Link href={`/servicos/${o.service.id}`} className="ml-auto inline-flex items-center gap-1 text-body-md font-bold text-primary hover:text-accent-strong transition-colors">
                      Ver serviço <Icon name="arrow_forward" size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
