'use client'
import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Report } from '@/types'
import toast from 'react-hot-toast'

type FilterStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed' | 'all'

export default function ModeracaoPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    adminApi.reports(filter === 'all' ? {} : { status: filter })
      .then((r) => setReports(r.data.data ?? []))
      .catch(() => toast.error('Erro ao carregar denúncias.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  async function moderate(id: string, action: 'dismiss' | 'warn' | 'remove' | 'ban') {
    try {
      await adminApi.moderateReport(id, action)
      toast.success('Ação aplicada.')
      load()
    } catch { toast.error('Erro ao aplicar ação.') }
  }

  const STATUS_BADGE: Record<Report['status'], { variant: 'error' | 'success' | 'pending' | 'verified'; label: string }> = {
    pending:   { variant: 'error',   label: 'Pendente' },
    reviewed:  { variant: 'pending', label: 'Em análise' },
    actioned:  { variant: 'success', label: 'Ação aplicada' },
    dismissed: { variant: 'pending', label: 'Arquivado' },
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-unit-xl overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-unit-xl">
            <div>
              <h1 className="text-headline-lg font-display font-black text-primary">Moderação</h1>
              <p className="text-body-md text-secondary">Denúncias e conteúdo a revisar</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-unit-lg overflow-x-auto no-scrollbar">
            {(['pending', 'reviewed', 'actioned', 'dismissed', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-full text-body-md whitespace-nowrap transition-colors border ${
                  filter === s ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-secondary hover:border-primary'
                }`}
              >
                {{ pending: 'Pendentes', reviewed: 'Em análise', actioned: 'Ação aplicada', dismissed: 'Arquivadas', all: 'Todas' }[s]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-unit-xl">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-unit-xl gap-4 text-center">
              <Icon name="gavel" size={64} className="text-outline-variant" />
              <p className="text-body-md text-secondary">Nenhuma denúncia nesta categoria.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-unit-sm">
              {reports.map((r) => (
                <div key={r.id} className="card-soft p-unit-lg">
                  <div className="flex items-start justify-between gap-unit-md flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Badge variant={STATUS_BADGE[r.status].variant}>
                          {STATUS_BADGE[r.status].label}
                        </Badge>
                        <span className="text-label-md text-secondary uppercase tracking-wider">
                          {r.targetType === 'listing' ? 'Anúncio' : 'Usuário'}
                        </span>
                        <span className="text-label-md text-outline">{formatDate(r.createdAt)}</span>
                      </div>

                      {r.targetType === 'listing' && r.listing && (
                        <div className="text-body-md font-bold text-on-surface mb-1">
                          Anúncio: {r.listing.title}
                        </div>
                      )}
                      {r.targetType === 'user' && r.user && (
                        <div className="text-body-md font-bold text-on-surface mb-1">
                          Usuário: {r.user.name}
                        </div>
                      )}

                      <div className="text-body-md text-secondary">
                        <strong>Motivo:</strong> {r.reason}
                      </div>
                      {r.details && (
                        <div className="text-body-md text-on-surface-variant mt-1 bg-surface-container rounded-lg p-2">
                          {r.details}
                        </div>
                      )}
                    </div>

                    {r.status === 'pending' && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moderate(r.id, 'dismiss')}
                        >
                          Arquivar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => moderate(r.id, 'warn')}
                        >
                          Advertir
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => moderate(r.id, 'remove')}
                          className="!bg-amber-500 !text-white"
                        >
                          Remover
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => moderate(r.id, 'ban')}
                        >
                          Banir
                        </Button>
                      </div>
                    )}
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
