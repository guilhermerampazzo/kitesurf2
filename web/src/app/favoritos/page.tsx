'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { ProductCard } from '@/components/ui/ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { favoritesApi, authApi } from '@/lib/api'
import type { Listing, User } from '@/types'

export default function FavoritosPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [favorites, setFavorites] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([authApi.me(), favoritesApi.list()])
      .then(([u, f]) => {
        if (cancelled) return
        setUser(u.data); setFavorites(f.data ?? [])
      })
      .catch(() => {
        if (cancelled) return
        try { router.replace('/login') }
        catch { window.location.href = '/login' }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [router])

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar userName={user?.name} userAvatar={user?.avatar} />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-headline-lg font-display font-black text-primary mb-2">
            Meus <span className="accent-word">favoritos</span>
          </h1>
          <p className="text-body-md text-on-surface-variant mb-10">
            {loading ? 'Carregando…' : `${favorites.length} ${favorites.length === 1 ? 'anúncio salvo' : 'anúncios salvos'}`}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <EmptyState
              icon="favorite"
              title="Nenhum favorito ainda"
              description="Salve anúncios interessantes para acompanhar depois — o vento pode virar."
              actionLabel="Explorar anúncios"
              actionHref="/buscar"
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {favorites.map((l) => <ProductCard key={l.id} listing={{ ...l, isFavorited: true }} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
