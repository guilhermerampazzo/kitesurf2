'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/Badge'
import { buberApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface RouteItem {
  id: string
  title: string
  originLabel: string
  destLabel: string
  stops?: string[]
  departsAt: string
  seatsTotal: number
  seatsTaken?: number
  seatsAvailable?: number
  pricePerSeat: number
  driverName?: string
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

function seatsLeft(r: RouteItem) {
  if (r.seatsAvailable != null) return r.seatsAvailable
  if (r.seatsTaken != null) return Math.max(0, r.seatsTotal - r.seatsTaken)
  return r.seatsTotal
}

export default function TrajetosPage() {
  const router = useRouter()
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [seatsByRoute, setSeatsByRoute] = useState<Record<string, number>>({})
  const [bookingId, setBookingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    buberApi.listRoutes()
      .then((r) => {
        const d = r.data
        setRoutes(Array.isArray(d) ? d : d.data ?? [])
      })
      .catch(() => toast.error('Erro ao carregar trajetos.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function book(route: RouteItem) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
    if (!token) {
      toast.error('Faça login para reservar.')
      router.push('/login?next=%2Fbuber%2Ftrajetos')
      return
    }
    const seats = seatsByRoute[route.id] ?? 1
    if (seats > seatsLeft(route)) { toast.error('Assentos insuficientes.'); return }
    setBookingId(route.id)
    try {
      await buberApi.bookRoute(route.id, seats)
      toast.success('Reserva confirmada!')
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao reservar.')
    } finally {
      setBookingId(null)
    }
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24 pt-2">
        <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
            <Icon name="arrow_back" size={20} />
          </button>
          <div>
            <h1 className="text-headline-lg font-display font-black text-primary">Trajetos compartilhados</h1>
            <p className="text-body-md text-secondary">Reserve seu assento em trajetos fixos de motoristas</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : routes.length === 0 ? (
          <div className="card-soft p-10 text-center">
            <Icon name="groups" size={48} className="text-outline mx-auto mb-3" />
            <p className="text-body-md text-secondary">Nenhum trajeto ativo no momento. Volte em breve!</p>
          </div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {routes.map((route) => {
              const left = seatsLeft(route)
              return (
                <li key={route.id} className="card-soft p-5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-title-md text-on-surface">{route.title}</span>
                    <Badge variant={left > 0 ? 'success' : 'error'}>
                      {left > 0 ? `${left} vaga(s)` : 'Lotado'}
                    </Badge>
                  </div>
                  <div className="text-body-md text-secondary flex items-center gap-1">
                    <Icon name="route" size={16} />
                    {route.originLabel} → {route.destLabel}
                  </div>
                  {route.stops && route.stops.length > 0 && (
                    <div className="text-body-md text-secondary">Paradas: {route.stops.join(' · ')}</div>
                  )}
                  <div className="text-body-md text-secondary flex items-center gap-1">
                    <Icon name="schedule" size={16} />
                    {route.departsAt ? new Date(route.departsAt).toLocaleString('pt-BR') : '—'}
                    {route.driverName ? ` · ${route.driverName}` : ''}
                  </div>
                  <div className="text-headline-md font-display font-black text-primary">
                    {brl(route.pricePerSeat)}
                    <span className="text-body-md font-normal text-secondary"> /assento</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number" min={1} max={Math.max(1, left)} aria-label="Assentos"
                      value={String(seatsByRoute[route.id] ?? 1)}
                      onChange={(e) => setSeatsByRoute((s) => ({ ...s, [route.id]: Math.max(1, parseInt(e.target.value || '1', 10)) }))}
                      className="!w-20"
                      disabled={left === 0}
                    />
                    <Button size="sm" onClick={() => book(route)} loading={bookingId === route.id} disabled={left === 0} className="flex-1">
                      <Icon name="event_seat" size={18} />
                      Reservar
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        </div>
      </main>
    </>
  )
}
