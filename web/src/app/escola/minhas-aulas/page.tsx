'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { kiteSchoolApi, authApi } from '@/lib/api'
import type { User } from '@/types'
import type { Enrollment } from '@/types/escola'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function MinhasAulasPage() {
  const [user, setUser] = useState<User | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    authApi.me()
      .then((r) => setUser(r.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    kiteSchoolApi.myEnrollments()
      .then((r) => {
        const data = r.data
        // api returns { data, total, page, totalPages } wrapped
        const arr: Enrollment[] = data.data ?? data ?? []
        setEnrollments(arr)
        setTotalPages(data.totalPages ?? 1)
        setPage(data.page ?? 1)
      })
      .catch(() => toast.error('Erro ao carregar matrículas.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar userName={user?.name} userAvatar={user?.avatar} />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-headline-lg font-display font-black text-primary">
                Minhas <span className="accent-word">aulas</span>
              </h1>
              <p className="text-body-md text-on-surface-variant">
                {loading ? 'Carregando…' : `${enrollments.length} ${enrollments.length === 1 ? 'curso matriculado' : 'cursos matriculados'}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/escola/categorias" className="inline-flex items-center gap-2 text-body-md font-bold text-secondary hover:text-primary">
                <Icon name="category" size={16} /> Categorias
              </Link>
              <Link href="/escola" className="inline-flex items-center gap-2 border-2 border-outline-variant px-4 py-2 rounded-full text-body-md font-bold hover:border-primary hover:text-primary transition-colors">
                <Icon name="school" size={16} /> Explorar cursos
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : enrollments.length === 0 ? (
            <EmptyState
              icon="auto_stories"
              title="Nenhuma matrícula ainda"
              description="Explore os cursos da Escola Kite e comece a evoluir — do zero ao avançado, no seu ritmo."
              actionLabel="Ver cursos"
              actionHref="/escola"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {enrollments.map((enr) => {
                  const c = enr.course
                  if (!c) return null
                  const thumb = c.thumbnail ?? '/imagens/kitesurf-card.webp'
                  const total = c.totalLessons || c._count?.lessons || 0
                  const completed = enr.completedLessons ?? 0
                  const progress = enr.progress ?? (total ? Math.round((completed / total) * 100) : 0)
                  return (
                    <Link
                      key={enr.id}
                      href={`/escola/curso/${c.id}`}
                      className="card-soft overflow-hidden product-card-hover flex flex-col group"
                    >
                      <div className="aspect-[16/9] bg-surface-container-low overflow-hidden relative photo-scrim">
                        <Image
                          src={thumb}
                          alt={c.title}
                          fill
                          className="object-cover group-hover:scale-[1.06] transition-transform duration-500"
                          sizes="(max-width:768px) 100vw, 50vw"
                          unoptimized={thumb.startsWith('/imagens') || thumb.startsWith('/uploads') || thumb.startsWith('http')}
                        />
                        <div className="absolute top-3 left-3 z-10 flex gap-2">
                          {c.isFree ? <Badge variant="success">Gratuito</Badge> : <Badge variant="sponsored">{formatPrice(c.price)}</Badge>}
                          {c.level && <Badge variant="onphoto" className="capitalize">{c.level}</Badge>}
                        </div>
                        <span className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                          enr.paymentStatus === 'paid' || enr.paymentStatus === 'free' ? 'bg-green-100 text-green-800' :
                          enr.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                          enr.paymentStatus === 'refunded' ? 'bg-error-container text-on-error-container' :
                          'bg-surface-container text-secondary'
                        }`}>
                          {enr.paymentStatus === 'free' ? 'Gratuito' : enr.paymentStatus === 'paid' ? 'Pago' : enr.paymentStatus === 'pending' ? 'Pendente' : enr.paymentStatus}
                        </span>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        {c.category && (
                          <span className="text-[11px] font-display font-bold uppercase tracking-wider text-outline mb-1">{c.category.name}</span>
                        )}
                        <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2 leading-snug">{c.title}</h3>
                        {c.instructor && (
                          <p className="text-body-md text-secondary mt-1 flex items-center gap-1.5">
                            <Icon name="person" size={14} /> {c.instructor.name}
                          </p>
                        )}

                        {/* Progress bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-label-md font-semibold text-on-surface-variant flex items-center gap-1">
                              <Icon name="task_alt" size={14} /> Progresso
                            </span>
                            <span className="text-label-md font-bold text-primary">{progress}%</span>
                          </div>
                          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-gradient rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-label-md text-secondary">
                            <span>{completed}/{total} aulas concluídas</span>
                            <span className="flex items-center gap-1"><Icon name="schedule" size={12} /> {c.totalDuration ? `${Math.round(c.totalDuration / 60)}min` : '—'}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-body-md font-bold text-primary group-hover:text-accent-strong inline-flex items-center gap-1">
                            Continuar <Icon name="arrow_forward" size={16} />
                          </span>
                          <span className="text-label-md text-secondary">
                            {new Date(enr.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        // simple: reload with page param via api? for now just local state; re-fetch would need param
                        // Since kiteSchoolApi.myEnrollments doesn't pass page via lib, we do manual fetch
                        const token = localStorage.getItem('kite_access_token')
                        fetch(`/api/kite-school/enrollments/mine?page=${p}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
                          .then((r) => r.json())
                          .then((data) => {
                            setEnrollments(data.data ?? [])
                            setPage(data.page ?? p)
                            setTotalPages(data.totalPages ?? 1)
                          })
                      }}
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-body-md font-display font-bold border transition-colors ${page === p ? 'bg-brand-gradient text-white border-transparent' : 'border-outline-variant hover:border-primary text-on-surface'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
