'use client'
import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { commissionApi } from '@/lib/api'
import toast from 'react-hot-toast'

type CommissionRow = { module: string; percentage: number; updatedAt?: string }

const MODULES: { key: string; label: string; icon: string }[] = [
  { key: 'kite_school',    label: 'Escola Kite',     icon: 'school' },
  { key: 'treino',         label: 'Treino',          icon: 'fitness_center' },
  { key: 'imoveis',        label: 'Imóveis',         icon: 'home_work' },
  { key: 'hospedagem',     label: 'Hospedagem',      icon: 'hotel' },
  { key: 'moda',           label: 'Moda',            icon: 'apparel' },
  { key: 'veiculos',       label: 'Veículos',        icon: 'directions_car' },
  { key: 'eventos',        label: 'Eventos',         icon: 'event' },
  { key: 'servicos',       label: 'Serviços',        icon: 'handyman' },
  { key: 'featured_event', label: 'Evento em Destaque', icon: 'star' },
  { key: 'boost',          label: 'Impulsionamento', icon: 'rocket_launch' },
]

export default function ComissoesPage() {
  const [rows, setRows] = useState<Record<string, number>>({})
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await commissionApi.list()
      const data: CommissionRow[] = res.data?.data ?? res.data ?? []
      const map: Record<string, number> = {}
      const inp: Record<string, string> = {}
      for (const r of data) {
        map[r.module] = Number(r.percentage)
        inp[r.module] = String(r.percentage)
      }
      // fill missing modules with 0 for inputs
      for (const m of MODULES) {
        if (inp[m.key] === undefined) inp[m.key] = map[m.key] != null ? String(map[m.key]) : '0'
        if (map[m.key] === undefined) map[m.key] = 0
      }
      setRows(map)
      setInputs(inp)
    } catch {
      // fallback: init zeros so UI is usable
      const inp: Record<string, string> = {}
      const map: Record<string, number> = {}
      for (const m of MODULES) { inp[m.key] = '0'; map[m.key] = 0 }
      setInputs(inp)
      setRows(map)
      toast.error('Erro ao carregar comissões. Exibindo valores padrão.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(module: string) {
    const raw = inputs[module]
    const pct = Number(raw)
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Percentual deve estar entre 0 e 100.')
      return
    }
    setSaving(module)
    try {
      await commissionApi.upsert(module, { percentage: pct })
      setRows((prev) => ({ ...prev, [module]: pct }))
      toast.success(`Comissão de ${MODULES.find((m) => m.key === module)?.label ?? module} salva.`)
    } catch {
      toast.error('Erro ao salvar comissão.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-unit-xl overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-unit-xl">
            <h1 className="text-headline-lg font-display font-black text-primary section-rule inline-block">Comissões</h1>
            <p className="text-body-md text-secondary mt-4">Configure o percentual de comissão por módulo da plataforma.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-unit-xl">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="card-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-container border-b border-outline-variant">
                    <tr>
                      <th className="text-left px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Módulo</th>
                      <th className="text-left px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Atual</th>
                      <th className="text-left px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Novo %</th>
                      <th className="px-unit-md py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {MODULES.map((m) => {
                      const current = rows[m.key] ?? 0
                      return (
                        <tr key={m.key} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-unit-md py-3">
                            <div className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                                <Icon name={m.icon} size={18} className="text-primary" />
                              </span>
                              <div>
                                <div className="text-body-md font-bold text-on-surface">{m.label}</div>
                                <div className="text-label-md text-outline">{m.key}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-unit-md py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-body-md font-bold bg-surface-container text-on-surface">
                              {current}%
                            </span>
                          </td>
                          <td className="px-unit-md py-3">
                            <div className="flex items-center gap-2 max-w-[160px]">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                value={inputs[m.key] ?? ''}
                                onChange={(e) => setInputs((prev) => ({ ...prev, [m.key]: e.target.value }))}
                                className="w-24 h-10 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
                              />
                              <span className="text-body-md text-secondary">%</span>
                            </div>
                          </td>
                          <td className="px-unit-md py-3 text-right">
                            <Button
                              size="sm"
                              loading={saving === m.key}
                              onClick={() => handleSave(m.key)}
                              className="shrink-0"
                            >
                              <Icon name="save" size={16} />
                              Salvar
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-unit-md py-4 bg-surface-container-low border-t border-outline-variant flex items-center gap-2 text-body-md text-secondary">
                <Icon name="info" size={18} className="text-outline" />
                Valores em percentual. Ex.: 10 = 10% de comissão sobre o valor da transação do módulo.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
