'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { listingsApi, authApi } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Listing, User } from '@/types'
import toast from 'react-hot-toast'

const STATUS_LABELS: Record<Listing['status'], string> = {
  active:     'Ativo',
  paused:     'Pausado',
  draft:      'Rascunho',
  sold:       'Vendido',
  expired:    'Expirado',
  moderation: 'Em análise',
}

const STATUS_COLORS: Record<Listing['status'], string> = {
  active:     'bg-green-100 text-green-800',
  paused:     'bg-amber-100 text-amber-800',
  draft:      'bg-surface-container text-secondary',
  sold:       'bg-secondary-container text-on-secondary-fixed-variant',
  expired:    'bg-error-container text-on-error-container',
  moderation: 'bg-primary-fixed text-on-primary-fixed-variant',
}

export default function MeusAnunciosPage() {
  const [user, setUser] = useState<User | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [filter, setFilter] = useState<Listing['status'] | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([authApi.me(), listingsApi.mine()])
      .then(([u, l]) => { setUser(u.data); setListings(l.data.data ?? []) })
      .catch(() => toast.error('Erro ao carregar anúncios.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleStatus(id: string, status: Listing['status']) {
    const newStatus = status === 'active' ? 'paused' : 'active'
    try {
      await listingsApi.update(id, { status: newStatus })
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: newStatus } : l))
      toast.success(newStatus === 'active' ? 'Anúncio reativado.' : 'Anúncio pausado.')
    } catch { toast.error('Erro ao atualizar anúncio.') }
  }

  async function deleteListing(id: string) {
    if (!confirm('Excluir este anúncio? Esta ação não pode ser desfeita.')) return
    try {
      await listingsApi.delete(id)
      setListings((prev) => prev.filter((l) => l.id !== id))
      toast.success('Anúncio excluído.')
    } catch { toast.error('Erro ao excluir anúncio.') }
  }

  const filtered = filter === 'all' ? listings : listings.filter((l) => l.status === filter)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar userName={user?.name} userAvatar={user?.avatar} />

      <main className="flex-1 p-unit-xl overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-unit-xl">
            <div>
              <h1 className="text-headline-lg font-display font-black text-primary">Meus Anúncios</h1>
              <p className="text-body-md text-secondary">{listings.length} anúncios no total</p>
            </div>
            <Link href="/painel/anuncios/novo">
              <Button><Icon name="add" size={18} /> Novo anúncio</Button>
            </Link>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-unit-lg overflow-x-auto no-scrollbar pb-1">
            {(['all', 'active', 'paused', 'sold', 'draft', 'expired'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-full text-body-md whitespace-nowrap transition-colors ${
                  filter === s ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest border border-outline-variant text-secondary hover:border-primary'
                }`}
              >
                {s === 'all' ? 'Todos' : STATUS_LABELS[s]} ({s === 'all' ? listings.length : listings.filter((l) => l.status === s).length})
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-unit-xl">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-unit-xl gap-4 text-center">
              <Icon name="sell" size={48} className="text-outline-variant" />
              <p className="text-body-md text-secondary">Nenhum anúncio nesta categoria.</p>
              <Link href="/painel/anuncios/novo"><Button>Criar primeiro anúncio</Button></Link>
            </div>
          ) : (
            <div className="flex flex-col gap-unit-sm">
              {filtered.map((l) => (
                <div key={l.id} className="card-soft p-unit-md flex items-center gap-unit-md">
                  {/* Image */}
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-surface-container-low shrink-0">
                    {l.images[0] ? (
                      <Image src={l.images[0].thumb} alt={l.title} width={80} height={64} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="image" size={24} className="text-outline-variant" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 flex-wrap">
                      <h3 className="text-body-md font-bold text-on-surface truncate flex-1">{l.title}</h3>
                      <span className={`text-label-md px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[l.status]}`}>
                        {STATUS_LABELS[l.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-unit-md mt-1 flex-wrap">
                      <span className="text-price-display font-bold text-primary">{formatPrice(l.price)}</span>
                      <span className="flex items-center gap-1 text-body-md text-secondary">
                        <Icon name="visibility" size={14} /> {l.viewCount}
                      </span>
                      <span className="flex items-center gap-1 text-body-md text-secondary">
                        <Icon name="favorite" size={14} /> {l.favoriteCount}
                      </span>
                      <span className="text-body-md text-secondary">{formatDate(l.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {l.status !== 'sold' && l.status !== 'expired' && (
                      <>
                        <Link href={`/painel/anuncios/${l.id}/impulsionar`}>
                          <button className="p-2 hover:bg-surface-container rounded-lg text-secondary hover:text-primary transition-colors" title="Impulsionar">
                            <Icon name="rocket_launch" size={18} />
                          </button>
                        </Link>
                        <Link href={`/painel/anuncios/${l.id}/editar`}>
                          <button className="p-2 hover:bg-surface-container rounded-lg text-secondary hover:text-primary transition-colors" title="Editar">
                            <Icon name="edit" size={18} />
                          </button>
                        </Link>
                        {(l.status === 'active' || l.status === 'paused') && (
                          <button
                            onClick={() => toggleStatus(l.id, l.status)}
                            className="p-2 hover:bg-surface-container rounded-lg text-secondary hover:text-primary transition-colors"
                            title={l.status === 'active' ? 'Pausar' : 'Reativar'}
                          >
                            <Icon name={l.status === 'active' ? 'pause_circle' : 'play_circle'} size={18} />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => deleteListing(l.id)}
                      className="p-2 hover:bg-error-container rounded-lg text-secondary hover:text-error transition-colors"
                      title="Excluir"
                    >
                      <Icon name="delete" size={18} />
                    </button>
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
