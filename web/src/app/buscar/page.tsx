import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ProductCard } from '@/components/ui/ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { BannerSlot } from '@/components/ads/BannerSlot'
import { Icon } from '@/components/ui/Icon'
import type { Listing, PaginatedResponse } from '@/types'
import Link from 'next/link'

interface SearchPageProps {
  searchParams: { q?: string; category?: string; condition?: string; priceMin?: string; priceMax?: string; sortBy?: string; state?: string; page?: string }
}

async function search(params: SearchPageProps['searchParams']): Promise<PaginatedResponse<Listing>> {
  const qs = new URLSearchParams()
  if (params.q)         qs.set('q', params.q)
  if (params.category)  qs.set('category', params.category)
  if (params.condition) qs.set('condition', params.condition)
  if (params.priceMin)  qs.set('priceMin', params.priceMin)
  if (params.priceMax)  qs.set('priceMax', params.priceMax)
  if (params.sortBy)    qs.set('sortBy', params.sortBy)
  if (params.state)     qs.set('state', params.state)
  qs.set('page', params.page ?? '1')
  qs.set('limit', '20')

  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL ?? 'http://api:8000'}/api/listings?${qs}`, { cache: 'no-store' })
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  }
}

const CATEGORIES = ['Kitesurf', 'Wingfoil', 'Kitefoil', 'Kitewave', 'Acessórios']
const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'newest',    label: 'Mais recentes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc',label: 'Maior preço' },
]

const filterField =
  'w-full bg-surface-container-low border border-transparent rounded-xl px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all'

export default async function BuscarPage({ searchParams }: SearchPageProps) {
  const result = await search(searchParams)

  return (
    <>
      <Header activeCategory={searchParams.category ? searchParams.category.charAt(0).toUpperCase() + searchParams.category.slice(1) : undefined} />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24">
        <div className="flex gap-gutter">
          {/* Filters sidebar */}
          <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
            <div className="card-soft p-5">
              <h3 className="text-label-md uppercase tracking-wider font-display font-bold text-on-surface-variant mb-3">Categoria</h3>
              <div className="flex flex-col gap-1">
                <Link
                  href={`/buscar?${new URLSearchParams({ ...searchParams, category: '' })}`}
                  className={`text-body-md py-1.5 px-3 -mx-3 rounded-full transition-colors ${!searchParams.category ? 'bg-brand-gradient text-white font-bold' : 'text-secondary hover:text-primary hover:bg-surface-container'}`}
                >
                  Todas
                </Link>
                {CATEGORIES.map((c) => (
                  <Link
                    key={c}
                    href={`/buscar?${new URLSearchParams({ ...searchParams, category: c.toLowerCase() })}`}
                    className={`text-body-md py-1.5 px-3 -mx-3 rounded-full transition-colors ${searchParams.category === c.toLowerCase() ? 'bg-brand-gradient text-white font-bold' : 'text-secondary hover:text-primary hover:bg-surface-container'}`}
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>

            <div className="card-soft p-5">
              <h3 className="text-label-md uppercase tracking-wider font-display font-bold text-on-surface-variant mb-3">Condição</h3>
              <div className="flex gap-2">
                {[['', 'Todos'], ['new', 'Novo'], ['used', 'Usado']].map(([val, label]) => (
                  <Link
                    key={val}
                    href={`/buscar?${new URLSearchParams({ ...searchParams, condition: val })}`}
                    className={`flex-1 text-center text-body-md py-2 rounded-full font-semibold border transition-all ${
                      (searchParams.condition ?? '') === val
                        ? 'border-transparent bg-primary-fixed text-on-primary-fixed'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="card-soft p-5">
              <h3 className="text-label-md uppercase tracking-wider font-display font-bold text-on-surface-variant mb-3">Preço (R$)</h3>
              <div className="flex gap-2">
                <input type="number" placeholder="Mín" defaultValue={searchParams.priceMin} className={filterField} />
                <input type="number" placeholder="Máx" defaultValue={searchParams.priceMax} className={filterField} />
              </div>
            </div>

            <div className="card-soft p-5">
              <h3 className="text-label-md uppercase tracking-wider font-display font-bold text-on-surface-variant mb-3">Estado</h3>
              <select defaultValue={searchParams.state ?? ''} className={`${filterField} cursor-pointer`}>
                <option value="">Todos</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h1 className="text-headline-lg font-display font-black text-primary">
                  {searchParams.q ? <>Resultados para <span className="accent-word">"{searchParams.q}"</span></> : searchParams.category ? searchParams.category.charAt(0).toUpperCase() + searchParams.category.slice(1) : 'Todos os anúncios'}
                </h1>
                <p className="text-body-md text-on-surface-variant mt-1">{result.total} anúncios encontrados</p>
              </div>
              <label className="flex items-center gap-2 text-body-md text-secondary">
                <span className="hidden sm:inline">Ordenar:</span>
                <select
                  defaultValue={searchParams.sortBy ?? 'relevance'}
                  className="bg-surface-container-lowest border border-outline-variant rounded-full px-4 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer font-semibold"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>

            <BannerSlot slot="top" className="w-full h-20 mb-6 rounded-card overflow-hidden" />

            {result.data.length === 0 ? (
              <EmptyState
                icon="search_off"
                title="Nenhum anúncio encontrado"
                description="Tente outros termos ou remova alguns filtros para ampliar a busca."
                actionLabel="Limpar e ver tudo"
                actionHref="/buscar"
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {result.data.map((l) => <ProductCard key={l.id} listing={l} />)}
              </div>
            )}

            {result.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/buscar?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
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
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
