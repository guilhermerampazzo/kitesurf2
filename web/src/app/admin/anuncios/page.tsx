'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'

const STATUS_TABS = ['all', 'active', 'paused', 'moderation', 'expired']
const STATUS_LABELS: Record<string, string> = { all: 'Todos', active: 'Ativos', paused: 'Pausados', moderation: 'Em análise', expired: 'Expirados' }

const STATUS_PILL: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  moderation: 'bg-amber-100 text-amber-700',
  paused: 'bg-secondary-container text-on-secondary-fixed-variant',
  expired: 'bg-surface-container-high text-on-surface-variant',
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchListings = async () => {
    setLoading(true)
    try {
      const res = await adminApi.listings({ page, status })
      setListings(res.data.data)
      setTotal(res.data.total)
    } catch { toast.error('Erro ao carregar anúncios.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchListings() }, [page, status])

  const handleModerate = async (id: string, newStatus: string) => {
    try {
      await adminApi.moderateReport(id, newStatus)
      toast.success('Status atualizado.')
      fetchListings()
    } catch { toast.error('Erro.') }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-headline-lg font-display font-black text-primary">Anúncios</h1>
            <p className="text-body-md text-on-surface-variant">{total} anúncios</p>
          </div>

          <div className="mb-5 flex gap-2 flex-wrap">
            {STATUS_TABS.map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1) }}
                className={`rounded-full px-5 py-2 text-body-md font-display font-bold transition-all ${
                  status === s ? 'bg-brand-gradient text-white shadow-soft' : 'card-soft !shadow-none text-on-surface-variant hover:text-primary'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="card-soft overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="p-4 text-left text-label-md font-display font-bold uppercase tracking-wider text-on-surface-variant">Anúncio</th>
                  <th className="p-4 text-left text-label-md font-display font-bold uppercase tracking-wider text-on-surface-variant">Vendedor</th>
                  <th className="p-4 text-left text-label-md font-display font-bold uppercase tracking-wider text-on-surface-variant">Preço</th>
                  <th className="p-4 text-left text-label-md font-display font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
                  <th className="p-4 text-right text-label-md font-display font-bold uppercase tracking-wider text-on-surface-variant">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">Carregando...</td></tr>
                ) : listings.map((listing: any) => (
                  <tr key={listing.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {listing.images?.[0] && (
                          <Image src={listing.images[0].thumb} alt={listing.title} width={48} height={48} className="rounded-xl object-cover" />
                        )}
                        <span className="font-semibold text-on-surface line-clamp-1">{listing.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-body-md text-on-surface-variant">{listing.seller?.name}</td>
                    <td className="p-4 text-body-md font-display font-bold text-on-surface">
                      {listing.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-display font-extrabold uppercase ${STATUS_PILL[listing.status] ?? 'bg-surface-container-high text-on-surface-variant'}`}>{listing.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {listing.status !== 'active' && (
                          <button onClick={() => handleModerate(listing.id, 'active')}
                            className="rounded-full bg-green-100 px-4 py-1.5 text-[11px] font-display font-bold text-green-700 hover:bg-green-200 transition-colors">
                            Aprovar
                          </button>
                        )}
                        {listing.status !== 'paused' && (
                          <button onClick={() => handleModerate(listing.id, 'paused')}
                            className="rounded-full bg-error-container px-4 py-1.5 text-[11px] font-display font-bold text-on-error-container hover:opacity-80 transition-colors">
                            Remover
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
