'use client'
import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { buberApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface DriverItem {
  id: string
  userId?: string
  name?: string
  email?: string
  cnh?: string
  vehicleModel?: string
  vehiclePlate?: string
  status: string
  isOnline?: boolean
}

interface Fare {
  minFare?: number
  pricePerKm?: number
  pricePerMin?: number
  cancelFee?: number
  [key: string]: unknown
}

export default function AdminBuberPage() {
  const { user, checking } = useRequireAuth()
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  const [fare, setFare] = useState<Fare>({})
  const [loadingFare, setLoadingFare] = useState(true)
  const [savingFare, setSavingFare] = useState(false)

  function loadDrivers() {
    setLoadingDrivers(true)
    buberApi.adminDrivers()
      .then((r) => {
        const d = r.data
        setDrivers(Array.isArray(d) ? d : d.data ?? [])
      })
      .catch(() => toast.error('Erro ao carregar motoristas.'))
      .finally(() => setLoadingDrivers(false))
  }

  function loadFare() {
    setLoadingFare(true)
    buberApi.adminFareGet()
      .then((r) => {
        const d = r.data
        setFare((d as { data?: Fare }).data ?? (d as Fare) ?? {})
      })
      .catch(() => toast.error('Erro ao carregar tarifa.'))
      .finally(() => setLoadingFare(false))
  }

  useEffect(() => {
    if (checking || !user) return
    if (!user.isAdmin) return
    loadDrivers()
    loadFare()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, user?.id])

  async function setDriverStatus(id: string, status: string) {
    setActingId(id)
    try {
      await buberApi.adminDriverStatus(id, status)
      toast.success('Status do motorista atualizado!')
      loadDrivers()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao atualizar motorista.')
    } finally {
      setActingId(null)
    }
  }

  async function saveFare(e: React.FormEvent) {
    e.preventDefault()
    setSavingFare(true)
    try {
      await buberApi.adminFarePut(fare)
      toast.success('Tarifa atualizada!')
      loadFare()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao salvar tarifa.')
    } finally {
      setSavingFare(false)
    }
  }

  function setNum(key: string, value: string) {
    setFare((f) => ({ ...f, [key]: value === '' ? undefined : parseFloat(value) }))
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!checking && user && !user.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="card-soft p-10 text-center max-w-md">
          <Icon name="lock" size={48} className="text-outline mx-auto mb-3" />
          <h1 className="text-title-lg font-bold text-on-surface mb-1">Acesso restrito</h1>
          <p className="text-body-md text-secondary">Esta área é exclusiva para administradores.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-unit-xl overflow-auto">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div>
            <h1 className="text-headline-lg font-display font-black text-primary">Buber — Gestão</h1>
            <p className="text-body-md text-secondary">Aprove motoristas e configure a tarifa das corridas</p>
          </div>

          {/* Motoristas */}
          <section>
            <h2 className="text-title-lg font-bold text-on-surface mb-4">Motoristas</h2>
            {loadingDrivers ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="card-soft overflow-hidden">
                <table className="w-full">
                  <thead className="bg-surface-container border-b border-outline-variant">
                    <tr>
                      <th className="text-left px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Motorista</th>
                      <th className="text-left px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Veículo</th>
                      <th className="text-left px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                      <th className="px-unit-md py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {drivers.length === 0 && (
                      <tr><td colSpan={4} className="px-unit-md py-unit-xl text-center text-secondary">Nenhum motorista cadastrado.</td></tr>
                    )}
                    {drivers.map((d) => (
                      <tr key={d.id} className="hover:bg-surface-container transition-colors">
                        <td className="px-unit-md py-3">
                          <div className="text-body-md font-bold text-on-surface">{d.name ?? d.userId ?? d.id}</div>
                          <div className="text-body-md text-secondary text-[12px]">{d.email ?? ''}{d.cnh ? ` · CNH ${d.cnh}` : ''}</div>
                        </td>
                        <td className="px-unit-md py-3 text-body-md text-secondary">
                          {[d.vehicleModel, d.vehiclePlate].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td className="px-unit-md py-3">
                          <Badge variant={d.status === 'approved' ? 'success' : d.status === 'suspended' || d.status === 'rejected' ? 'error' : 'pending'}>
                            {d.status}
                          </Badge>
                        </td>
                        <td className="px-unit-md py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" variant="secondary" onClick={() => setDriverStatus(d.id, 'approved')} loading={actingId === d.id}>
                              Aprovar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDriverStatus(d.id, 'suspended')} loading={actingId === d.id}>
                              Bloquear
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Tarifa */}
          <section>
            <h2 className="text-title-lg font-bold text-on-surface mb-4">Tarifa</h2>
            {loadingFare ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={saveFare} className="card-soft p-6 flex flex-col gap-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Tarifa mínima (R$)" type="number" min={0} step={0.01}
                    value={fare.minFare != null ? String(fare.minFare) : ''} onChange={(e) => setNum('minFare', e.target.value)} />
                  <Input label="Por km (R$)" type="number" min={0} step={0.01}
                    value={fare.pricePerKm != null ? String(fare.pricePerKm) : ''} onChange={(e) => setNum('pricePerKm', e.target.value)} />
                  <Input label="Por minuto (R$)" type="number" min={0} step={0.01}
                    value={fare.pricePerMin != null ? String(fare.pricePerMin) : ''} onChange={(e) => setNum('pricePerMin', e.target.value)} />
                  <Input label="Taxa de cancelamento (R$)" type="number" min={0} step={0.01}
                    value={fare.cancelFee != null ? String(fare.cancelFee) : ''} onChange={(e) => setNum('cancelFee', e.target.value)} />
                </div>
                <Button type="submit" loading={savingFare} className="self-start">
                  <Icon name="save" size={18} />
                  Salvar tarifa
                </Button>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
