'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/Badge'
import { BuberMapPicker, type MapPoint } from '@/components/buber/BuberMapPicker'
import { buberApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface Estimate {
  distanceKm: number
  durationMin: number
  price: number
}

interface RouteItem {
  id: string
  title: string
  originLabel: string
  destLabel: string
  departsAt: string
  seatsTotal: number
  seatsTaken?: number
  seatsAvailable?: number
  pricePerSeat: number
  driverName?: string
}

interface RideItem {
  id: string
  originLabel: string
  destLabel: string
  status: string
  price?: number
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

async function searchNominatim(q: string): Promise<NominatimResult[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=pt-BR&q=${encodeURIComponent(q)}`,
    { headers: { Accept: 'application/json' } }
  )
  if (!res.ok) throw new Error('Falha na busca de endereço.')
  return res.json()
}

function pointLabel(p: MapPoint) {
  return `Ponto no mapa (${p.lat.toFixed(5)}, ${p.lng.toFixed(5)})`
}

export default function BuberPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'corrida' | 'trajetos'>('corrida')

  // Origem / destino
  const [originLabel, setOriginLabel] = useState('')
  const [destLabel, setDestLabel] = useState('')
  const [origin, setOrigin] = useState<MapPoint | null>(null)
  const [dest, setDest] = useState<MapPoint | null>(null)
  const [target, setTarget] = useState<'origin' | 'dest'>('origin')

  // Busca de endereços (Nominatim)
  const [originResults, setOriginResults] = useState<NominatimResult[]>([])
  const [destResults, setDestResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState<'origin' | 'dest' | null>(null)

  // Estimativa + corrida
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [calling, setCalling] = useState(false)
  const [activeRide, setActiveRide] = useState<RideItem | null>(null)
  const [myRides, setMyRides] = useState<RideItem[]>([])

  // Trajetos
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [routesLoading, setRoutesLoading] = useState(false)
  const [seatsByRoute, setSeatsByRoute] = useState<Record<string, number>>({})
  const [bookingId, setBookingId] = useState<string | null>(null)

  async function doSearch(which: 'origin' | 'dest') {
    const q = which === 'origin' ? originLabel : destLabel
    if (q.trim().length < 3) { toast.error('Digite ao menos 3 letras para buscar.'); return }
    setSearching(which)
    try {
      const results = await searchNominatim(which === 'origin' ? originLabel : destLabel)
      if (which === 'origin') setOriginResults(results)
      else setDestResults(results)
      if (results.length === 0) toast.error('Nenhum endereço encontrado.')
    } catch {
      toast.error('Erro ao buscar endereço.')
    } finally {
      setSearching(null)
    }
  }

  function pickResult(which: 'origin' | 'dest', r: NominatimResult) {
    const p = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) }
    if (which === 'origin') {
      setOrigin(p); setOriginLabel(r.display_name); setOriginResults([])
    } else {
      setDest(p); setDestLabel(r.display_name); setDestResults([])
    }
    setTarget(which === 'origin' ? 'dest' : 'origin')
  }

  function onMapPick(p: MapPoint) {
    if (target === 'origin') {
      setOrigin(p)
      if (!originLabel) setOriginLabel(pointLabel(p))
    } else {
      setDest(p)
      if (!destLabel) setDestLabel(pointLabel(p))
    }
  }

  // Estimativa automática quando origem + destino definidos
  useEffect(() => {
    setEstimate(null)
    if (!origin || !dest) return
    setEstimating(true)
    const t = setTimeout(() => {
      buberApi.estimate({ originLat: origin.lat, originLng: origin.lng, destLat: dest.lat, destLng: dest.lng })
        .then((r) => setEstimate(r.data))
        .catch(() => setEstimate(null))
        .finally(() => setEstimating(false))
    }, 600)
    return () => clearTimeout(t)
  }, [origin, dest])

  function requireToken() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
    if (!token) {
      toast.error('Faça login para continuar.')
      router.push('/login?next=%2Fbuber')
      return false
    }
    return true
  }

  async function callRide() {
    if (!origin || !dest) { toast.error('Defina origem e destino no mapa.'); return }
    if (!requireToken()) return
    setCalling(true)
    try {
      const { data } = await buberApi.createRide({
        originLabel: originLabel || pointLabel(origin),
        originLat: origin.lat, originLng: origin.lng,
        destLabel: destLabel || pointLabel(dest),
        destLat: dest.lat, destLng: dest.lng,
      })
      setActiveRide(data)
      toast.success('Corrida solicitada! Aguardando motorista.')
      refreshMyRides()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao chamar corrida.')
    } finally {
      setCalling(false)
    }
  }

  async function refreshMyRides() {
    if (typeof window === 'undefined' || !localStorage.getItem('kite_access_token')) return
    try {
      const { data } = await buberApi.myRides()
      setMyRides(Array.isArray(data) ? data : data.data ?? [])
    } catch { /* silencioso: passageiro pode não ter corridas */ }
  }

  async function loadRoutes() {
    setRoutesLoading(true)
    try {
      const { data } = await buberApi.listRoutes()
      setRoutes(Array.isArray(data) ? data : data.data ?? [])
    } catch {
      toast.error('Erro ao carregar trajetos.')
    } finally {
      setRoutesLoading(false)
    }
  }

  useEffect(() => {
    refreshMyRides()
    loadRoutes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (tab === 'trajetos') loadRoutes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab ])

  async function bookRoute(route: RouteItem) {
    if (!requireToken()) return
    const seats = seatsByRoute[route.id] ?? 1
    setBookingId(route.id)
    try {
      await buberApi.bookRoute(route.id, seats)
      toast.success('Assento(s) reservado(s)!')
      loadRoutes()
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
        <div className="flex items-center gap-3 mb-2">
          <span className="w-11 h-11 rounded-2xl bg-brand-gradient flex items-center justify-center">
            <Icon name="local_taxi" size={24} className="text-white" />
          </span>
          <div>
            <h1 className="text-headline-lg font-display font-black text-primary">Buber</h1>
            <p className="text-body-md text-secondary">Corridas e trajetos compartilhados na região</p>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mt-6 mb-6">
          <button
            onClick={() => setTab('corrida')}
            className={`nav-chip ${tab === 'corrida' ? 'nav-chip-active' : ''}`}
          >
            <Icon name="route" size={16} filled={tab === 'corrida'} />
            Pedir corrida
          </button>
          <button
            onClick={() => setTab('trajetos')}
            className={`nav-chip ${tab === 'trajetos' ? 'nav-chip-active' : ''}`}
          >
            <Icon name="groups" size={16} filled={tab === 'trajetos'} />
            Trajetos
          </button>
        </div>

        {tab === 'corrida' ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-soft p-6 flex flex-col gap-4">
              <h2 className="text-title-lg font-bold text-on-surface">Para onde vamos?</h2>

              <div className="flex gap-2">
                <button
                  onClick={() => setTarget('origin')}
                  className={`nav-chip flex-1 justify-center ${target === 'origin' ? 'nav-chip-active' : ''}`}
                >
                  <Icon name="trip_origin" size={16} /> Origem
                </button>
                <button
                  onClick={() => setTarget('dest')}
                  className={`nav-chip flex-1 justify-center ${target === 'dest' ? 'nav-chip-active' : ''}`}
                >
                  <Icon name="location_on" size={16} /> Destino
                </button>
              </div>

              <div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label="Origem"
                      placeholder="Ex: Cumbuco, Caucaia"
                      value={originLabel}
                      onChange={(e) => setOriginLabel(e.target.value)}
                    />
                  </div>
                  <Button variant="secondary" size="sm" className="self-end" onClick={() => doSearch('origin')} loading={searching === 'origin'}>
                    <Icon name="search" size={18} />
                  </Button>
                </div>
                {originResults.length > 0 && (
                  <ul className="mt-2 border border-outline-variant rounded-xl overflow-hidden divide-y divide-outline-variant">
                    {originResults.map((r) => (
                      <li key={r.place_id}>
                        <button onClick={() => pickResult('origin', r)} className="w-full text-left px-3 py-2 text-body-md hover:bg-surface-container transition-colors">
                          {r.display_name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label="Destino"
                      placeholder="Ex: Fortaleza, Beira Mar"
                      value={destLabel}
                      onChange={(e) => setDestLabel(e.target.value)}
                    />
                  </div>
                  <Button variant="secondary" size="sm" className="self-end" onClick={() => doSearch('dest')} loading={searching === 'dest'}>
                    <Icon name="search" size={18} />
                  </Button>
                </div>
                {destResults.length > 0 && (
                  <ul className="mt-2 border border-outline-variant rounded-xl overflow-hidden divide-y divide-outline-variant">
                    {destResults.map((r) => (
                      <li key={r.place_id}>
                        <button onClick={() => pickResult('dest', r)} className="w-full text-left px-3 py-2 text-body-md hover:bg-surface-container transition-colors">
                          {r.display_name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <BuberMapPicker origin={origin} dest={dest} target={target} onPick={onMapPick} />

              <div className="rounded-xl bg-surface-container-low border border-outline-variant p-4 flex items-center justify-between">
                {estimating ? (
                  <span className="text-body-md text-secondary">Calculando preço…</span>
                ) : estimate ? (
                  <>
                    <div>
                      <div className="text-label-md text-secondary uppercase tracking-wider font-bold">Estimativa</div>
                      <div className="text-body-md text-secondary">
                        {estimate.distanceKm?.toFixed(1)} km · ~{Math.round(estimate.durationMin)} min
                      </div>
                    </div>
                    <div className="text-headline-md font-display font-black text-primary">{brl(estimate.price)}</div>
                  </>
                ) : (
                  <span className="text-body-md text-secondary">Defina origem e destino para ver o preço.</span>
                )}
              </div>

              <Button onClick={callRide} loading={calling} disabled={!origin || !dest} className="w-full">
                <Icon name="local_taxi" size={18} />
                Chamar Buber
              </Button>

              {activeRide && (
                <div className="rounded-xl border border-primary bg-primary-fixed p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-on-surface">Corrida solicitada</span>
                    <Badge variant="verified">{activeRide.status}</Badge>
                  </div>
                  <p className="text-body-md text-secondary mt-1">{activeRide.originLabel} → {activeRide.destLabel}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <div className="card-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-title-lg font-bold text-on-surface">Minhas corridas</h2>
                  <button onClick={refreshMyRides} className="p-2 hover:bg-surface-container rounded-lg transition-colors" title="Atualizar">
                    <Icon name="refresh" size={20} />
                  </button>
                </div>
                {myRides.length === 0 ? (
                  <p className="text-body-md text-secondary">Nenhuma corrida ainda. Faça login para ver seu histórico.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {myRides.slice(0, 5).map((r) => (
                      <li key={r.id} className="border border-outline-variant rounded-xl p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-body-md font-bold truncate">{r.originLabel} → {r.destLabel}</p>
                          {r.price != null && <p className="text-body-md text-secondary">{brl(r.price)}</p>}
                        </div>
                        <Badge variant={r.status === 'completed' ? 'success' : r.status === 'cancelled' ? 'error' : 'pending'}>
                          {r.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link href="/buber/motorista/cadastro" className="card-soft p-6 flex items-center gap-4 hover:shadow-float transition-shadow bg-brand-gradient !border-0">
                <span className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                  <Icon name="directions_car" size={26} className="text-white" />
                </span>
                <span>
                  <span className="block text-title-lg font-display font-black text-white">Seja motorista Buber</span>
                  <span className="block text-body-md text-white/80">Ganhe dirigindo na sua região →</span>
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="card-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-title-lg font-bold text-on-surface">Trajetos compartilhados</h2>
              <Link href="/buber/trajetos" className="text-body-md font-bold text-primary hover:underline">Ver todos →</Link>
            </div>
            {routesLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : routes.length === 0 ? (
              <p className="text-body-md text-secondary">Nenhum trajeto ativo no momento.</p>
            ) : (
              <ul className="grid md:grid-cols-2 gap-4">
                {routes.slice(0, 4).map((route) => (
                  <li key={route.id} className="border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
                    <div className="font-bold text-on-surface">{route.title}</div>
                    <div className="text-body-md text-secondary flex items-center gap-1">
                      <Icon name="route" size={16} /> {route.originLabel} → {route.destLabel}
                    </div>
                    <div className="text-body-md text-secondary">
                      {route.departsAt ? new Date(route.departsAt).toLocaleString('pt-BR') : ''} · {brl(route.pricePerSeat)}/assento
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number" min={1} max={8} aria-label="Assentos"
                        value={String(seatsByRoute[route.id] ?? 1)}
                        onChange={(e) => setSeatsByRoute((s) => ({ ...s, [route.id]: Math.max(1, parseInt(e.target.value || '1', 10)) }))}
                        className="!w-20"
                      />
                      <Button size="sm" onClick={() => bookRoute(route)} loading={bookingId === route.id}>
                        Reservar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        </div>
      </main>
    </>
  )
}
