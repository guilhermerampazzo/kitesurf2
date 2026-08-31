import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { CourseCard } from '@/components/escola/CourseCard'
import type { Course, CourseCategory } from '@/types/escola'
import type { PaginatedResponse } from '@/types'

interface EscolaSearchParams {
  q?: string
  category?: string
  level?: string
  isFree?: string
  page?: string
}

const BASE = process.env.INTERNAL_API_URL ?? 'http://api:8000'

async function fetchCourses(params: EscolaSearchParams): Promise<PaginatedResponse<Course>> {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', params.q)
  if (params.category) qs.set('category', params.category)
  if (params.level) qs.set('level', params.level)
  if (params.isFree) qs.set('isFree', params.isFree)
  qs.set('page', params.page ?? '1')
  qs.set('limit', '12')
  try {
    const res = await fetch(`${BASE}/api/kite-school/courses?${qs}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(String(res.status))
    return await res.json()
  } catch {
    return { data: [], total: 0, page: 1, limit: 12, totalPages: 0 }
  }
}

async function fetchCategories(): Promise<CourseCategory[]> {
  try {
    const res = await fetch(`${BASE}/api/kite-school/categories`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : data.data ?? []
  } catch {
    return []
  }
}

const LEVEL_OPTIONS = [
  { value: '', label: 'Todos os níveis' },
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
]

const PRICE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Gratuitos' },
  { value: 'false', label: 'Pagos' },
]

function buildHref(base: EscolaSearchParams, overrides: Partial<EscolaSearchParams>): string {
  const next = { ...base, ...overrides }
  // clean empty
  const qs = new URLSearchParams()
  if (next.q) qs.set('q', next.q)
  if (next.category) qs.set('category', next.category)
  if (next.level) qs.set('level', next.level)
  if (next.isFree) qs.set('isFree', next.isFree)
  if (next.page && next.page !== '1') qs.set('page', next.page)
  const str = qs.toString()
  return str ? `/escola?${str}` : '/escola'
}

export default async function EscolaPage({ searchParams }: { searchParams: EscolaSearchParams }) {
  const [result, categories] = await Promise.all([fetchCourses(searchParams), fetchCategories()])

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24">
        {/* Title + Criar Curso */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-headline-lg font-display font-black text-primary section-rule inline-block">
              Escola <span className="accent-word">Kite</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant mt-4 max-w-xl">
              Cursos com instrutores certificados — do zero ao avançado. Aprenda kitesurf, wingfoil e kitefoil com quem vive o vento.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/escola/minhas-aulas"
              className="inline-flex items-center gap-2 border-2 border-outline-variant text-on-surface font-display font-bold px-5 py-2.5 rounded-full hover:border-primary hover:text-primary transition-colors text-body-md"
            >
              <Icon name="auto_stories" size={18} />
              Minhas aulas
            </Link>
            <Link
              href="/escola/criar"
              className="btn-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-display font-extrabold text-body-md shadow-soft hover:shadow-float transition-shadow"
            >
              <Icon name="add" size={18} />
              Criar Curso
            </Link>
          </div>
        </div>

        {/* Filters bar */}
        <div className="card-soft p-4 md:p-5 mb-8">
          <form action="/escola" method="get" className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Icon name="search" size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
              <input
                name="q"
                defaultValue={searchParams.q ?? ''}
                placeholder="Buscar cursos... ex: kitesurf iniciante"
                className="w-full h-11 pl-11 pr-4 bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
              />
            </div>

            {/* Category select */}
            <div className="relative min-w-[180px]">
              <select
                name="category"
                defaultValue={searchParams.category ?? ''}
                className="w-full h-11 pl-4 pr-9 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold"
              >
                <option value="">Todas categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>

            {/* Level */}
            <div className="relative min-w-[170px]">
              <select
                name="level"
                defaultValue={searchParams.level ?? ''}
                className="w-full h-11 pl-4 pr-9 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold"
              >
                {LEVEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>

            {/* Price type */}
            <div className="relative min-w-[150px]">
              <select
                name="isFree"
                defaultValue={searchParams.isFree ?? ''}
                className="w-full h-11 pl-4 pr-9 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold"
              >
                {PRICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>

            <button
              type="submit"
              className="h-11 px-6 rounded-full bg-primary text-on-primary font-display font-bold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shrink-0"
            >
              <Icon name="filter_list" size={18} />
              Filtrar
            </button>
            {(searchParams.q || searchParams.category || searchParams.level || searchParams.isFree) && (
              <Link
                href="/escola"
                className="h-11 px-6 rounded-full border-2 border-outline-variant text-on-surface font-display font-bold inline-flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors shrink-0"
              >
                Limpar
              </Link>
            )}
          </form>

          {/* Active chips */}
          {(searchParams.category || searchParams.level || searchParams.isFree || searchParams.q) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-outline-variant">
              {searchParams.q && (
                <span className="inline-flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-body-md">
                  <Icon name="search" size={14} /> &ldquo;{searchParams.q}&rdquo;
                  <Link href={buildHref(searchParams, { q: undefined })} className="ml-1 hover:text-primary">
                    <Icon name="close" size={14} />
                  </Link>
                </span>
              )}
              {searchParams.category && (() => {
                const cat = categories.find((c) => c.id === searchParams.category || c.slug === searchParams.category)
                return (
                  <span className="inline-flex items-center gap-1.5 bg-surface-container border border-outline-variant px-3 py-1 rounded-full text-body-md">
                    {cat?.name ?? searchParams.category}
                    <Link href={buildHref(searchParams, { category: undefined })} className="hover:text-primary">
                      <Icon name="close" size={14} />
                    </Link>
                  </span>
                )
              })()}
              {searchParams.level && (
                <span className="inline-flex items-center gap-1.5 bg-surface-container border border-outline-variant px-3 py-1 rounded-full text-body-md capitalize">
                  {searchParams.level}
                  <Link href={buildHref(searchParams, { level: undefined })} className="hover:text-primary">
                    <Icon name="close" size={14} />
                  </Link>
                </span>
              )}
              {searchParams.isFree && (
                <span className="inline-flex items-center gap-1.5 bg-surface-container border border-outline-variant px-3 py-1 rounded-full text-body-md">
                  {searchParams.isFree === 'true' ? 'Gratuitos' : 'Pagos'}
                  <Link href={buildHref(searchParams, { isFree: undefined })} className="hover:text-primary">
                    <Icon name="close" size={14} />
                  </Link>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-body-md text-on-surface-variant">
            <span className="font-bold text-on-surface">{result.total}</span> {result.total === 1 ? 'curso encontrado' : 'cursos encontrados'}
          </p>
        </div>

        {result.data.length === 0 ? (
          <EmptyState
            icon="school"
            title="Nenhum curso encontrado"
            description="Tente outros termos ou remova alguns filtros para ampliar a busca."
            actionLabel="Ver todos os cursos"
            actionHref="/escola"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {result.data.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>

            {result.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={buildHref(searchParams, { page: String(p) })}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-body-md font-display font-bold border transition-colors ${
                      result.page === p
                        ? 'bg-brand-gradient text-white border-transparent'
                        : 'border-outline-variant hover:border-primary text-on-surface'
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
