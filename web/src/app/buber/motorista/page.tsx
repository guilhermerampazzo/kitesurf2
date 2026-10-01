'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/Badge'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { buberApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface RideItem {
  id: string
  originLabel: string
  destLabel: string
  status: string
  price?: number
  distanceKm?: number
}

interface RouteItem {
  id: string
  title: string
  originLabel: string
  destLabel: string
  departsAt: string
  seatsTotal: number
  pricePerSeat: number
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

const NEXT_STATUS: Record<string, { status: string; label: string }[]> = {
  accepted: [
    { status: 'arriving', label: 'A caminho' },
    { status: 'cancelled', label: 'Cancelar' },
  ],
  arriving: [
    { status: 'ongoing', label: 'Iniciar corrida' },
    { status: 'cancelled', label: 'Cancelar' },
  ],
  ongoing: [{ status: 'completed', label: 'Concluir' }],
  requested: [{ status: 'cancelled', label: 'Cancelar' }],
}

export default function MotoristaPage() {
  const router = useRouter()
  const { checking } = useRequireAuth()

  const [isOnline, setIsOnline] = useState(false)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [toggling, setToggling] = useState(false)

  const [available, setAvailable] = useState<RideItem[]>([])
  const [mine, setMine] = useState<RideItem[]>([])
  const [loadingLists, setLoadingLists] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [rTitle, setRTitle] = useState('')
  const [rOrigin, setROrigin] = useState('')
  const [rDest, setRDest] = useState('')
  const [rStops, setRStops] = useState('')
  const [rDepartsAt, setRDepartsAt] = useState('')
  const [rSeats, setRSeats] = useState('3')
  const [rPrice, setRPrice] = useState('')
  const [creatingRoute, setCreatingRoute] = useState(false)

  function listOf(data: unknown): RideItem[] {
    if (Array.isArray(data)) return data as RideItem[]
    const d = (data as { data?: unknown })?.data
    return Array.isArray(d) ? (d as RideItem[]) : []
  }

  async function loadAll() {
    setLoadingLists(true)
    try {
      const [av, my, rt] = await Promise.allSettled([
        buberApi.availableRides(),
        buberApi.myRides(),
        buberApi.listRoutes(),
      ])
      if (av.status === 'fulfilled') setAvailable(listOf(av.value.data))
      if (my.status === 'fulfilled') setMine(listOf(my.value.data))
      if (rt.status === 'fulfilled') {
        const d = rt.value.data
        setRoutes(Array.isArray(d) ? d : (d as { data?: RouteItem[] }).data ?? [])
      }
    } finally {
      setLoadingLists(false)
    }
  }

  useEffect(() => {
    if (!checking) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking])

  function useMyLocation() {
    if (!navigator.geolocation) { toast.error('Geolocalização não suportada.'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude))
        setLng(String(pos.coords.longitude))
        toast.success('Localização capturada!')
      },
      () => toast.error('Não foi possível obter a localização.'),
      { enableHighAccuracy: true }
    )
  }

  async function toggleOnline() {
    setToggling(true)
    try {
      const next = !isOnline
      await buberApi.goOnline({
        isOnline: next,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
      })
      setIsOnline(next)
      toast.success(next ? 'Você está online!' : 'Você ficou offline.')
      if (next) loadAll()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao alterar status.')
    } finally {
      setToggling(false)
    }
  }

  async function acceptRide(id: string) {
    setActingId(id)
    try {
      await buberApi.acceptRide(id)
      toast.success('Corrida aceita!')
      loadAll()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao aceitar corrida.')
    } finally {
      setActingId(null)
    }
  }

  async function updateRideStatus(id: string, status: string) {
    setActingId(id)
    try {
      await buberApi.rideStatus(id, status)
      toast.success('Status atualizado!')
      loadAll()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao atualizar corrida.')
    } finally {
      setActingId(null)
    }
  }

  async function createRoute(e: React.FormEvent) {
    e.preventDefault()
    setCreatingRoute(true)
    try {
      const { data } = await buberApi.createRoute({
        title: rTitle,
        originLabel: rOrigin,
        destLabel: rDest,
        stops: rStops.split(',').map((s) => s.trim()).filter(Boolean),
        departsAt: new Date(rDepartsAt).toISOString(),
        seatsTotal: parseInt(rSeats, 10),
        pricePerSeat: parseFloat(rPrice),
      })
      const created = (data as { data?: RouteItem })?.data ?? (data as RouteItem)
      if (created?.id) setRoutes((prev) => [created, ...prev])
      toast.success('Trajeto publicado!')
      setRTitle(''); setROrigin(''); setRDest(''); setRStops(''); setRDepartsAt(''); setRSeats('3'); setRPrice('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao criar trajeto.')
    } finally {
      setCreatingRoute(false)
    }
  }

  const earnings = mine
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + (r.price ?? 0), 0)
  const completedCount = mine.filter((r) => r.status === 'completed').length

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24 pt-2">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
            <Icon name="arrow_back" size={20} />
          </button>
          <div>
            <h1 className="text-headline-lg font-display font-black text-primary">Painel do motorista</h1>
            <p className="text-body-md text-secondary">Gerencie disponibilidade, corridas e trajetos</p>
          </div>
        </div>

        {/* Status online + ganhos */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-soft p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-title-lg font-bold text-on-surface">Disponibilidade</h2>
              <Badge variant={isOnline ? 'success' : 'pending'}>{isOnline ? 'Online' : 'Offline'}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Latitude" placeholder="-3.6276" value={lat} onChange={(e) => setLat(e.target.value)} />
              <Input label="Longitude" placeholder="-38.8661" value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={useMyLocation} className="flex-1">
                <Icon name="my_location" size={18} />
                Minha posição
              </Button>
              <Button variant={isOnline ? 'danger' : 'primary'} onClick={toggleOnline} loading={toggling} className="flex-1">
                {isOnline ? 'Ficar offline' : 'Ficar online'}
              </Button>
            </div>
          </div>

          <div className="card-soft p-6 flex flex-col justify-center gap-1">
            <h2 className="text-title-lg font-bold text-on-surface">Ganhos (corridas concluídas)</h2>
            <div className="text-headline-lg font-display font-black text-primary">{brl(earnings)}</div>
            <p className="text-body-md text-secondary">{completedCount} corrida(s) concluída(s)</p>
          </div>
        </div>

        {/* Corridas disponíveis */}
        <div className="card-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-lg font-bold text-on-surface">Corridas disponíveis</h2>
            <button onClick={loadAll} className="p-2 hover:bg-surface-container rounded-lg transition-colors" title="Atualizar">
              <Icon name="refresh" size={20} />
            </button>
          </div>
          {loadingLists ? (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : available.length === 0 ? (
            <p className="text-body-md text-secondary">
              {isOnline ? 'Nenhuma corrida disponível no momento.' : 'Fique online para receber corridas.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {available.map((r) => (
                <li key={r.id} className="border border-outline-variant rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-body-md font-bold">{r.originLabel} → {r.destLabel}</p>
                    <p className="text-body-md text-secondary">
                      {r.distanceKm != null ? `${r.distanceKm.toFixed(1)} km · ` : ''}{r.price != null ? brl(r.price) : ''}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => acceptRide(r.id)} loading={actingId === r.id}>
                    Aceitar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Minhas corridas */}
        <div className="card-soft p-6">
          <h2 className="text-title-lg font-bold text-on-surface mb-4">Minhas corridas</h2>
          {mine.length === 0 ? (
            <p className="text-body-md text-secondary">Nenhuma corrida ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {mine.map((r) => (
                <li key={r.id} className="border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-body-md font-bold min-w-0 truncate">{r.originLabel} → {r.destLabel}</p>
                    <Badge variant={r.status === 'completed' ? 'success' : r.status === 'cancelled' ? 'error' : 'pending'}>
                      {r.status}
                    </Badge>
                  </div>
                  {r.price != null && <p className="text-body-md text-secondary">{brl(r.price)}</p>}
                  {(NEXT_STATUS[r.status] ?? []).length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {NEXT_STATUS[r.status].map((n) => (
                        <Button
                          key={n.status}
                          size="sm"
                          variant={n.status === 'cancelled' ? 'ghost' : 'secondary'}
                          onClick={() => updateRideStatus(r.id, n.status)}
                          loading={actingId === r.id}
                        >
                          {n.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Meus trajetos + criar */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-soft p-6">
            <h2 className="text-title-lg font-bold text-on-surface mb-4">Meus trajetos</h2>
            {routes.length === 0 ? (
              <p className="text-body-md text-secondary">Nenhum trajeto publicado.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {routes.map((t) => (
                  <li key={t.id} className="border border-outline-variant rounded-xl p-3">
                    <p className="text-body-md font-bold">{t.title}</p>
                    <p className="text-body-md text-secondary">{t.originLabel} → {t.destLabel}</p>
                    <p className="text-body-md text-secondary">
                      {t.departsAt ? new Date(t.departsAt).toLocaleString('pt-BR') : ''} · {t.seatsTotal} assentos · {brl(t.pricePerSeat)}/assento
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={createRoute} className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-bold text-on-surface">Criar trajeto</h2>
            <Input label="Título" placeholder="Ex: Cumbuco → Fortaleza (manhã)" value={rTitle} onChange={(e) => setRTitle(e.target.value)} required />
            <Input label="Origem" placeholder="Ex: Cumbuco" value={rOrigin} onChange={(e) => setROrigin(e.target.value)} required />
            <Input label="Destino" placeholder="Ex: Fortaleza" value={rDest} onChange={(e) => setRDest(e.target.value)} required />
            <Input label="Paradas (separadas por vírgula)" placeholder="Ex: Caucaia, Icarai" value={rStops} onChange={(e) => setRStops(e.target.value)} />
            <Input label="Partida" type="datetime-local" value={rDepartsAt} onChange={(e) => setRDepartsAt(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Assentos" type="number" min={1} max={8} value={rSeats} onChange={(e) => setRSeats(e.target.value)} required />
              <Input label="Preço/assento (R$)" type="number" min={0} step={0.01} value={rPrice} onChange={(e) => setRPrice(e.target.value)} required />
            </div>
            <Button type="submit" loading={creatingRoute} className="w-full">
              <Icon name="add" size={18} />
              Publicar trajeto
            </Button>
          </form>
        </div>
        </div>
      </main>
    </>
  )
}
