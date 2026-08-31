'use client'
import { useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { trainingApi } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type Booking = {
  id: string
  date: string
  startTime: string
  endTime?: string
  status: string
  notes?: string
  paymentMethod?: string
  service?: { id: string; title: string; price: number }
  user?: { name?: string }
  trainer?: { businessName?: string }
}

export default function TreinoAgendaPage() {
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [received, setReceived] = useState<Booking[]>([])
  const [tab, setTab] = useState<'mine' | 'received'>('mine')
  const [loading, setLoading] = useState(true)

  // Availability management — minimal since API doesn't expose list/create/delete explicitly beyond availabilities in service
  // We provide a simple status manager for bookings

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [mineRes, recvRes] = await Promise.all([
        trainingApi.myBookings().catch(() => ({ data: [] })),
        trainingApi.received().catch(() => ({ data: [] })),
      ])
      const mine = mineRes.data?.data ?? mineRes.data ?? []
      const rec = recvRes.data?.data ?? recvRes.data ?? []
      setMyBookings(Array.isArray(mine) ? mine : [])
      setReceived(Array.isArray(rec) ? rec : [])
    } catch {
      toast.error('Erro ao carregar agenda.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await trainingApi.updateBooking(id, { status })
      toast.success(status === 'confirmed' ? 'Reserva confirmada.' : status === 'cancelled' ? 'Reserva cancelada.' : 'Status atualizado.')
      load()
    } catch {
      toast.error('Erro ao atualizar reserva.')
    }
  }

  const list = tab === 'mine' ? myBookings : received

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-headline-lg font-display font-black text-primary mb-2">Agenda — Treino</h1>
          <p className="text-body-md text-secondary mb-6">Gerencie seus agendamentos e solicitações recebidas.</p>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab('mine')}
              className={`px-5 py-2.5 rounded-full text-body-md font-bold transition-colors ${tab === 'mine' ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest border border-outline-variant text-secondary hover:border-primary'}`}
            >
              <span className="inline-flex items-center gap-2">
                <Icon name="event" size={18} />
                Meus agendamentos ({myBookings.length})
              </span>
            </button>
            <button
              onClick={() => setTab('received')}
              className={`px-5 py-2.5 rounded-full text-body-md font-bold transition-colors ${tab === 'received' ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest border border-outline-variant text-secondary hover:border-primary'}`}
            >
              <span className="inline-flex items-center gap-2">
                <Icon name="inbox" size={18} />
                Recebidos — como treinador ({received.length})
              </span>
            </button>
            <button onClick={load} className="ml-auto p-2.5 rounded-full border border-outline-variant hover:border-primary transition-colors" title="Recarregar">
              <Icon name="refresh" size={18} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="card-soft p-12 text-center">
              <Icon name="calendar_month" size={48} className="text-outline-variant mb-3" />
              <p className="text-body-md text-secondary">
                {tab === 'mine' ? 'Você ainda não tem agendamentos.' : 'Nenhuma reserva recebida ainda.'}
              </p>
              {tab === 'mine' && (
                <a href="/treino" className="inline-flex items-center gap-2 mt-4 text-primary font-bold hover:text-accent-strong">
                  Explorar serviços <Icon name="arrow_forward" size={18} />
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {list.map((b) => (
                <div key={b.id} className="card-soft p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-title-lg font-bold text-on-surface truncate">{b.service?.title ?? 'Agendamento'}</h3>
                      <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'error' : b.status === 'pending' ? 'pending' : 'verified'} className="capitalize">
                        {b.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-body-md text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="calendar_today" size={14} /> {formatDate(b.date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="schedule" size={14} /> {b.startTime}
                        {b.endTime ? ` — ${b.endTime}` : ''}
                      </span>
                      {b.service?.price != null && <span className="font-bold text-primary">{formatPrice(b.service.price)}</span>}
                    </div>
                    {b.notes && <p className="text-body-md text-on-surface-variant mt-2 bg-surface-container-low rounded-xl px-3 py-2">{b.notes}</p>}
                    {tab === 'received' && b.user?.name && <p className="text-body-md text-secondary mt-1 flex items-center gap-1"><Icon name="person" size={14} /> Cliente: {b.user.name}</p>}
                    {tab === 'mine' && b.trainer?.businessName && <p className="text-body-md text-secondary mt-1 flex items-center gap-1"><Icon name="fitness_center" size={14} /> {b.trainer.businessName}</p>}
                    {b.paymentMethod && <p className="text-label-md text-secondary mt-1 uppercase tracking-wider">Pagamento: {b.paymentMethod}</p>}
                  </div>

                  {tab === 'received' && b.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => updateStatus(b.id, 'confirmed')}>
                        <Icon name="check" size={16} />
                        Confirmar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, 'cancelled')}>
                        <Icon name="close" size={16} />
                        Recusar
                      </Button>
                    </div>
                  )}
                  {tab === 'received' && b.status === 'confirmed' && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, 'cancelled')}>
                      Cancelar
                    </Button>
                  )}
                  {tab === 'mine' && b.status === 'pending' && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, 'cancelled')}>
                      Cancelar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-4 bg-surface-container-low rounded-xl flex items-start gap-3 text-body-md text-secondary">
            <Icon name="info" size={20} className="text-primary shrink-0 mt-0.5" />
            <span>
              Dica: treinadores gerenciam disponibilidades diretamente no cadastro do serviço. Para editar horários semanais, atualize o serviço em <a href="/treino" className="text-primary font-bold hover:underline">Treino</a>.
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
