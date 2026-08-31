'use client'
import { useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { StarRating } from '@/components/ui/StarRating'
import { Icon } from '@/components/ui/Icon'
import { reviewsApi, authApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Review, User } from '@/types'

export default function MinhasAvaliacoesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([authApi.me(), reviewsApi.mine()])
      .then(([u, r]) => { setUser(u.data); setReviews(r.data.reviews ?? []) })
      .finally(() => setLoading(false))
  }, [])

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }))

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar userName={user?.name} userAvatar={user?.avatar} />

      <main className="flex-1 p-unit-xl overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-headline-lg font-display font-black text-primary mb-unit-xl">Minhas Avaliações</h1>

          {!loading && (
            <div className="card-soft p-unit-xl mb-unit-xl flex flex-col md:flex-row gap-unit-xl items-start">
              <div className="text-center">
                <div className="text-[56px] font-black text-primary leading-none">{avg.toFixed(1)}</div>
                <StarRating value={avg} size={24} />
                <div className="text-body-md text-secondary mt-2">{reviews.length} avaliações</div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {dist.map(({ n, count }) => (
                  <div key={n} className="flex items-center gap-3">
                    <span className="text-body-md text-secondary w-4">{n}</span>
                    <Icon name="star" filled size={14} className="text-amber-400" />
                    <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-body-md text-secondary w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-unit-xl">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-unit-xl">
              <Icon name="star" size={64} className="text-outline-variant" />
              <p className="text-body-md text-secondary mt-4">Nenhuma avaliação recebida ainda.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-unit-md">
              {reviews.map((r) => (
                <div key={r.id} className="card-soft p-unit-lg">
                  <div className="flex items-center gap-3 mb-unit-sm">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold">
                      {r.author.name[0]}
                    </div>
                    <div>
                      <div className="text-body-md font-bold text-on-surface">{r.author.name}</div>
                      <div className="flex items-center gap-2">
                        <StarRating value={r.rating} size={14} />
                        <span className="text-label-md text-secondary">{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-body-md text-on-surface-variant">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
