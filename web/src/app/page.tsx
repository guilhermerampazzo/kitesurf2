import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BannerSlot } from '@/components/ads/BannerSlot'
import { ProductCard } from '@/components/ui/ProductCard'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import type { Listing } from '@/types'

async function getFeaturedListings(): Promise<Listing[]> {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL ?? 'http://api:8000'}/api/listings?boosted=true&limit=4`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return MOCK_LISTINGS.slice(0, 4)
    const data = await res.json()
    return data.data ?? MOCK_LISTINGS.slice(0, 4)
  } catch { return MOCK_LISTINGS.slice(0, 4) }
}

async function getRecentListings(): Promise<Listing[]> {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL ?? 'http://api:8000'}/api/listings?sortBy=newest&limit=8`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return MOCK_LISTINGS
    const data = await res.json()
    return data.data ?? MOCK_LISTINGS
  } catch { return MOCK_LISTINGS }
}

// ── New verticals ───────────────────────────────────────────────────────────
type CourseItem = { id: string; title: string; price: number; level?: string; image?: string; category?: string }
type TrainingItem = { id: string; title: string; price: number; duration?: string; trainer?: string; image?: string }
type PropertyItem = { id: string; title: string; price: number; city: string; state?: string; image?: string }
type AccommodationItem = { id: string; title: string; pricePerNight: number; city: string; image?: string }
type EventItem = { id: string; title: string; date: string; city: string; price?: number; image?: string }
type ServiceItem = { id: string; title: string; price: number; category?: string; image?: string }

async function getKiteCourses(): Promise<CourseItem[]> {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL ?? 'http://api:8000'}/api/kite-school/courses?limit=3`, { next: { revalidate: 60 } })
    if (!res.ok) return MOCK_COURSES
    const data = await res.json()
    const arr = data.data ?? data ?? []
    return arr.length ? arr.slice(0, 3).map(normalizeCourse) : MOCK_COURSES
  } catch { return MOCK_COURSES }
}
function normalizeCourse(c: Record<string, unknown>): CourseItem {
  return {
    id: String(c.id ?? c._id ?? Math.random()),
    title: String(c.title ?? c.name ?? 'Curso Kite'),
    price: Number(c.price ?? 0),
    level: String(c.level ?? c.category ?? 'Iniciante'),
    image: String(c.image ?? c.cover ?? c.thumbnail ?? ''),
  }
}

async function getTrainingServices(): Promise<TrainingItem[]> {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL ?? 'http://api:8000'}/api/training/services?limit=3`, { next: { revalidate: 60 } })
    if (!res.ok) return MOCK_TRAINING
    const data = await res.json()
    const arr = data.data ?? data ?? []
    return arr.length ? arr.slice(0, 3).map(normalizeTraining) : MOCK_TRAINING
  } catch { return MOCK_TRAINING }
}
function normalizeTraining(s: Record<string, unknown>): TrainingItem {
  return {
    id: String(s.id ?? s._id ?? Math.random()),
    title: String(s.title ?? s.name ?? 'Treino'),
    price: Number(s.price ?? 0),
    duration: s.duration ? String(s.duration) : undefined,
    trainer: s.trainer ? String((s.trainer as Record<string, unknown>).name ?? s.trainer) : undefined,
    image: String(s.image ?? s.cover ?? ''),
  }
}

async function getProperties(): Promise<PropertyItem[]> {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL ?? 'http://api:8000'}/api/properties?limit=2`, { next: { revalidate: 60 } })
    if (!res.ok) return MOCK_PROPERTIES
    const data = await res.json()
    const arr = data.data ?? data ?? []
    return arr.length ? arr.slice(0, 2).map(normalizeProperty) : MOCK_PROPERTIES
  } catch { return MOCK_PROPERTIES }
}
function normalizeProperty(p: Record<string, unknown>): PropertyItem {
  return {
    id: String(p.id ?? p._id ?? Math.random()),
    title: String(p.title ?? p.name ?? 'Imóvel'),
    price: Number(p.price ?? 0),
    city: String(p.city ?? '—'),
    state: p.state ? String(p.state) : undefined,
    image: String(p.image ?? p.cover ?? (Array.isArray(p.images) ? (p.images as string[])[0] : '') ?? ''),
  }
}

async function getAccommodations(): Promise<AccommodationItem[]> {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL ?? 'http://api:8000'}/api/accommodations?limit=2`, { next: { revalidate: 60 } })
    if (!res.ok) return MOCK_ACCOMMODATIONS
    const data = await res.json()
    const arr = data.data ?? data ?? []
    return arr.length ? arr.slice(0, 2).map(normalizeAccommodation) : MOCK_ACCOMMODATIONS
  } catch { return MOCK_ACCOMMODATIONS }
}
function normalizeAccommodation(a: Record<string, unknown>): AccommodationItem {
  return {
    id: String(a.id ?? a._id ?? Math.random()),
    title: String(a.title ?? a.name ?? 'Hospedagem'),
    pricePerNight: Number(a.pricePerNight ?? a.price ?? 0),
    city: String(a.city ?? '—'),
    image: String(a.image ?? a.cover ?? ''),
  }
}

async function getEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL ?? 'http://api:8000'}/api/events?limit=3`, { next: { revalidate: 60 } })
    if (!res.ok) return MOCK_EVENTS
    const data = await res.json()
    const arr = data.data ?? data ?? []
    return arr.length ? arr.slice(0, 3).map(normalizeEvent) : MOCK_EVENTS
  } catch { return MOCK_EVENTS }
}
function normalizeEvent(e: Record<string, unknown>): EventItem {
  return {
    id: String(e.id ?? e._id ?? Math.random()),
    title: String(e.title ?? e.name ?? 'Evento'),
    date: String(e.date ?? e.startsAt ?? e.startDate ?? new Date().toISOString()),
    city: String(e.city ?? e.location ?? '—'),
    price: e.price != null ? Number(e.price) : undefined,
    image: String(e.image ?? e.cover ?? ''),
  }
}

async function getServices(): Promise<ServiceItem[]> {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL ?? 'http://api:8000'}/api/services?limit=3`, { next: { revalidate: 60 } })
    if (!res.ok) return MOCK_SERVICES
    const data = await res.json()
    const arr = data.data ?? data ?? []
    return arr.length ? arr.slice(0, 3).map(normalizeService) : MOCK_SERVICES
  } catch { return MOCK_SERVICES }
}
function normalizeService(s: Record<string, unknown>): ServiceItem {
  return {
    id: String(s.id ?? s._id ?? Math.random()),
    title: String(s.title ?? s.name ?? 'Serviço'),
    price: Number(s.price ?? 0),
    category: s.category ? String(s.category) : undefined,
    image: String(s.image ?? s.cover ?? ''),
  }
}

const TRUST_ITEMS = [
  { icon: 'verified_user', title: 'Compra Segura', text: 'Negocie com proteção do início ao desembarque.' },
  { icon: 'badge', title: 'Vendedor Verificado', text: 'Perfis checados e avaliações reais da comunidade.' },
  { icon: 'reviews', title: 'Equipamentos Avaliados', text: 'Notas e comentários de quem já voou com o gear.' },
  { icon: 'support_agent', title: 'Suporte 7 Dias', text: 'Gente de água no suporte, não robô em terra.' },
]

const CATEGORIES = [
  { label: 'Kitesurf',   icon: 'air',      category: 'kitesurf',    count: '1.2 mil anúncios', img: '/imagens/kitesurf.webp' },
  { label: 'Wingfoil',   icon: 'surfing',  category: 'wingfoil',    count: '480 anúncios',     img: '/imagens/wakesurf.webp' },
  { label: 'Kitefoil',   icon: 'tsunami',  category: 'kitefoil',    count: '310 anúncios',     img: '/imagens/surfer.webp' },
  { label: 'Kitewave',   icon: 'waves',    category: 'kitewave',    count: '260 anúncios',     img: '/imagens/hero-1.webp' },
  { label: 'Acessórios', icon: 'build',    category: 'acessorios',  count: '900+ itens',       img: '/imagens/hero-2.webp' },
]

export default async function HomePage() {
  const [featured, recent, courses, trainings, properties, accommodations, events, services] = await Promise.all([
    getFeaturedListings(),
    getRecentListings(),
    getKiteCourses(),
    getTrainingServices(),
    getProperties(),
    getAccommodations(),
    getEvents(),
    getServices(),
  ])

  return (
    <>
      <Header activeCategory="Home" />

      {/* ══ HERO — busca como protagonista, mar como cenário ══════════════ */}
      <section className="relative bg-[#001e40]">
        <div className="absolute inset-0 photo-scrim">
          <Image
            src="/imagens/kitesurf.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70"
          />
        </div>

        <div className="relative max-w-container mx-auto px-margin-desktop pt-44 pb-40 md:pt-52 md:pb-48 text-white">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-label-md font-display font-bold uppercase tracking-widest text-accent mb-4">
              <span className="w-8 h-0.5 bg-accent rounded-full" />
              O marketplace do vento
            </p>
            <h1 className="font-display font-black leading-[1.05] text-[40px] md:text-[56px] mb-5">
              Compre e venda seu gear.
              <br />
              <span className="accent-word">Vento</span> a favor sempre.
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl">
              Kites, pranchas, wings e acessórios de kitesurf, wingfoil e kitefoil —
              de quem está na água, com segurança de ponta a ponta.
            </p>
          </div>
        </div>

        {/* Cartão de busca flutuante */}
        <div className="relative max-w-container mx-auto px-margin-desktop -mb-12 z-10">
          <form
            action="/buscar"
            className="card-soft !border-0 shadow-float p-4 md:p-5 grid grid-cols-1 md:grid-cols-[1fr_170px_170px_auto] gap-3"
          >
            <label className="relative">
              <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input
                name="q"
                placeholder="O que você procura? Ex: Duotone Rebel 10m"
                className="w-full h-12 pl-11 pr-4 bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
              />
            </label>
            <label className="relative">
              <Icon name="category" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <select
                name="category"
                defaultValue=""
                className="w-full h-12 pl-11 pr-4 appearance-none bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="">Categoria</option>
                <option value="kitesurf">Kitesurf</option>
                <option value="wingfoil">Wingfoil</option>
                <option value="kitefoil">Kitefoil</option>
                <option value="kitewave">Kitewave</option>
                <option value="acessorios">Acessórios</option>
              </select>
              <Icon name="expand_more" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </label>
            <label className="relative">
              <Icon name="location_on" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input
                name="city"
                placeholder="Cidade ou estado"
                className="w-full h-12 pl-11 pr-4 bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
              />
            </label>
            <button
              type="submit"
              className="btn-accent h-12 px-8 rounded-full font-display font-extrabold text-[15px] inline-flex items-center justify-center gap-2 hover:shadow-float transition-shadow active:scale-95"
            >
              <Icon name="search" size={20} />
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* ══ TRUST STRIP ══════════════════════════════════════════════════ */}
      <section className="max-w-container mx-auto px-margin-desktop pt-24 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_ITEMS.map((t) => (
            <div key={t.title} className="card-soft p-5 flex items-start gap-4 hover:shadow-float hover:-translate-y-1 transition-all duration-300">
              <span className="trust-chip-icon shrink-0">
                <Icon name={t.icon} size={24} />
              </span>
              <div>
                <h3 className="font-display font-extrabold text-on-surface text-[15px]">{t.title}</h3>
                <p className="text-body-md text-on-surface-variant mt-0.5">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <main className="max-w-container mx-auto px-margin-desktop">
        {/* ══ CATEGORIAS — tiles foto-first ══════════════════════════════ */}
        <section className="pt-16">
          <SectionHeading
            title={<>Explore por <span className="accent-word">categoria</span></>}
            actionLabel="Ver todos os equipamentos"
            actionHref="/buscar"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.category}
                href={`/buscar?category=${cat.category}`}
                className={`group relative rounded-card overflow-hidden photo-scrim product-card-hover ${i === 0 ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <div className={i === 0 ? 'aspect-[4/3]' : 'aspect-[4/3]'}>
                  <Image
                    src={cat.img}
                    alt={cat.label}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover group-hover:scale-[1.06] transition-transform duration-500"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                  <div className="flex items-center gap-2 text-white">
                    <Icon name={cat.icon} size={20} className="text-accent" />
                    <h3 className="font-display font-extrabold text-white">{cat.label}</h3>
                  </div>
                  <p className="text-[12px] text-white/70 mt-0.5">{cat.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══ DESTAQUES ══════════════════════════════════════════════════ */}
        <section className="pt-16">
          <SectionHeading
            title={<>Em <span className="accent-word">destaque</span></>}
            subtitle="Equipamentos impulsionados por vendedores verificados."
            actionLabel="Ver todos"
            actionHref="/buscar?boosted=true"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.map((l) => <ProductCard key={l.id} listing={l} />)}
          </div>
        </section>

        {/* ══ FAIXA CTA — vendedor ═══════════════════════════════════════ */}
        <section className="pt-20">
          <div className="relative rounded-card overflow-hidden bg-brand-gradient px-8 py-12 md:px-14 md:py-16 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] items-center gap-10">
            <div>
              <Badge variant="onphoto" className="!bg-accent !text-accent-ink mb-4">Para vendedores</Badge>
              <h2 className="font-display font-black text-white text-3xl md:text-4xl leading-tight mb-3">
                Seu gear parado está custando <span className="accent-word">vento</span>.
              </h2>
              <p className="text-white/75 text-lg max-w-lg">
                Anuncie em minutos, fale direto com quem procura e alcance milhares de
                pilotos de kitesurf, wingfoil e kitefoil em todo o Brasil.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-8">
                <Link
                  href="/painel/anuncios/novo"
                  className="btn-accent inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-display font-extrabold text-on-surface hover:shadow-float transition-shadow"
                >
                  <Icon name="add_circle" size={20} />
                  Anunciar grátis
                </Link>
                <Link href="/planos" className="inline-flex items-center gap-2 text-white/85 font-semibold hover:text-accent transition-colors">
                  Conhecer os planos
                  <Icon name="arrow_forward" size={18} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 lg:gap-3">
              {[
                { n: '8 mil+', l: 'anúncios ativos' },
                { n: '4.9★', l: 'avaliação média' },
                { n: '48h', l: 'venda média' },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-5 text-center">
                  <div className="font-display font-black text-3xl text-accent">{s.n}</div>
                  <div className="text-[12px] text-white/70 mt-1 leading-snug">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ RECENTES ═══════════════════════════════════════════════════ */}
        <section className="pt-16">
          <SectionHeading
            title={<>Recém-<span className="accent-word">chegados</span></>}
            subtitle="As últimas oportunidades que entraram no marketplace."
            actionLabel="Ver tudo"
            actionHref="/buscar?sortBy=newest"
          />

          <BannerSlot slot="between-listings" className="w-full h-20 mb-6 hidden md:block" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {recent.map((l) => <ProductCard key={l.id} listing={l} />)}
          </div>
        </section>

        {/* ══ ESCOLA KITE ════════════════════════════════════════════════ */}
        <section className="pt-16">
          <SectionHeading
            title={<>Escola <span className="accent-word">Kite</span></>}
            subtitle="Cursos com instrutores certificados — do zero ao avançado."
            actionLabel="Ver todos os cursos"
            actionHref="/escola"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {courses.map((c) => (
              <Link key={c.id} href={`/escola/${c.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                <div className="aspect-[16/10] bg-surface-container-low overflow-hidden relative photo-scrim">
                  {c.image ? (
                    <Image src={c.image} alt={c.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                  ) : (
                    <Image src="/imagens/kitesurf.webp" alt="" fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                  )}
                  {c.level && <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10">{c.level}</Badge>}
                  <span className="trust-chip-icon absolute top-3 right-3 z-10 !w-8 !h-8">
                    <Icon name="school" size={16} />
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2 leading-snug">{c.title}</h3>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="text-price-display font-display font-black text-primary">{c.price ? formatPrice(c.price) : 'Consultar'}</span>
                    <span className="text-body-md font-bold text-primary group-hover:text-accent-strong inline-flex items-center gap-1">Ver curso <Icon name="arrow_forward" size={16} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══ TREINO & BEM-ESTAR ═════════════════════════════════════════ */}
        <section className="pt-16">
          <SectionHeading
            title={<>Treino & <span className="accent-word">Bem-estar</span></>}
            subtitle="Personal, fisioterapia e preparação física para evoluir na água."
            actionLabel="Ver treinos"
            actionHref="/treino"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {trainings.map((t) => (
              <Link key={t.id} href={`/treino/${t.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                <div className="aspect-[16/10] bg-surface-container-low overflow-hidden relative photo-scrim">
                  {t.image ? (
                    <Image src={t.image} alt={t.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                  ) : (
                    <Image src="/imagens/hero-2.webp" alt="" fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                  )}
                  <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10">{t.duration ?? '60 min'}</Badge>
                  <span className="trust-chip-icon absolute top-3 right-3 z-10 !w-8 !h-8">
                    <Icon name="fitness_center" size={16} />
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2">{t.title}</h3>
                  {t.trainer && <p className="text-body-md text-on-surface-variant mt-1 flex items-center gap-1"><Icon name="person" size={14} /> {t.trainer}</p>}
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="text-price-display font-display font-black text-primary">{formatPrice(t.price)}/sessão</span>
                    <span className="text-body-md font-bold text-primary group-hover:text-accent-strong inline-flex items-center gap-1">Agendar <Icon name="arrow_forward" size={16} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══ IMÓVEIS & HOSPEDAGEM — 2 colunas ═══════════════════════════ */}
        <section className="pt-16">
          <SectionHeading
            title={<>Imóveis & <span className="accent-word">Hospedagem</span></>}
            subtitle="Fique perto do vento — casas, flats e pousadas nos melhores picos."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Imóveis */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-extrabold text-on-surface flex items-center gap-2"><Icon name="home_work" size={20} className="text-primary" /> Imóveis</h3>
                <Link href="/imoveis" className="text-body-md font-bold text-primary hover:text-accent-strong inline-flex items-center gap-1">Ver todos <Icon name="arrow_forward" size={16} /></Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {properties.map((p) => (
                  <Link key={p.id} href={`/imoveis/${p.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                    <div className="aspect-[16/10] bg-surface-container-low overflow-hidden relative photo-scrim">
                      {p.image ? (
                        <Image src={p.image} alt={p.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 50vw, 25vw" />
                      ) : (
                        <Image src="/imagens/beach-couple-card.webp" alt="" fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 50vw, 25vw" />
                      )}
                      <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10 flex items-center gap-1"><Icon name="location_on" size={12} /> {p.city}{p.state ? `, ${p.state}` : ''}</Badge>
                    </div>
                    <div className="p-4">
                      <h4 className="font-display font-extrabold text-on-surface line-clamp-2 text-[15px] leading-snug">{p.title}</h4>
                      <div className="text-price-display font-display font-black text-primary mt-2">{formatPrice(p.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            {/* Hospedagem */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-extrabold text-on-surface flex items-center gap-2"><Icon name="hotel" size={20} className="text-primary" /> Hospedagem</h3>
                <Link href="/hospedagem" className="text-body-md font-bold text-primary hover:text-accent-strong inline-flex items-center gap-1">Ver todas <Icon name="arrow_forward" size={16} /></Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accommodations.map((a) => (
                  <Link key={a.id} href={`/hospedagem/${a.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                    <div className="aspect-[16/10] bg-surface-container-low overflow-hidden relative photo-scrim">
                      {a.image ? (
                        <Image src={a.image} alt={a.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 50vw, 25vw" />
                      ) : (
                        <Image src="/imagens/surfer-card.webp" alt="" fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 50vw, 25vw" />
                      )}
                      <Badge variant="sponsored" className="absolute top-3 left-3 z-10">a partir de</Badge>
                      <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10 flex items-center gap-1"><Icon name="location_on" size={12} /> {a.city}</Badge>
                    </div>
                    <div className="p-4">
                      <h4 className="font-display font-extrabold text-on-surface line-clamp-2 text-[15px] leading-snug">{a.title}</h4>
                      <div className="text-price-display font-display font-black text-primary mt-2">{formatPrice(a.pricePerNight)}<span className="text-body-md font-normal text-on-surface-variant"> /noite</span></div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ EVENTOS ════════════════════════════════════════════════════ */}
        <section className="pt-16">
          <SectionHeading
            title={<><span className="accent-word">Eventos</span> em destaque</>}
            subtitle="Campeonatos, downwinds e confras — não fique fora d'água."
            actionLabel="Ver todos os eventos"
            actionHref="/eventos"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {events.map((ev) => (
              <Link key={ev.id} href={`/eventos/${ev.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                <div className="aspect-[16/10] bg-surface-container-low overflow-hidden relative photo-scrim">
                  {ev.image ? (
                    <Image src={ev.image} alt={ev.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                  ) : (
                    <Image src="/imagens/hero-1-card.webp" alt="" fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                  )}
                  <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10 flex items-center gap-1"><Icon name="calendar_today" size={12} /> {formatEventDate(ev.date)}</Badge>
                  <span className="trust-chip-icon absolute top-3 right-3 z-10 !w-8 !h-8">
                    <Icon name="event" size={16} />
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2">{ev.title}</h3>
                  <p className="text-body-md text-on-surface-variant mt-1 flex items-center gap-1"><Icon name="location_on" size={14} /> {ev.city}</p>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="text-body-md font-bold text-primary">{ev.price != null ? formatPrice(ev.price) : 'Gratuito'}</span>
                    <span className="text-body-md font-bold text-primary group-hover:text-accent-strong inline-flex items-center gap-1">Ingressos <Icon name="arrow_forward" size={16} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══ SERVIÇOS ═══════════════════════════════════════════════════ */}
        <section className="pt-16 pb-8">
          <SectionHeading
            title={<><span className="accent-word">Serviços</span> para o seu kite</>}
            subtitle="Conserto, revisão, customização e tudo que seu gear precisa."
            actionLabel="Ver todos os serviços"
            actionHref="/servicos"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {services.map((s) => (
              <Link key={s.id} href={`/servicos/${s.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                <div className="aspect-[16/10] bg-surface-container-low overflow-hidden relative photo-scrim">
                  {s.image ? (
                    <Image src={s.image} alt={s.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                  ) : (
                    <Image src="/imagens/wakesurf-card.webp" alt="" fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                  )}
                  {s.category && <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10">{s.category}</Badge>}
                  <span className="trust-chip-icon absolute top-3 right-3 z-10 !w-8 !h-8">
                    <Icon name="handyman" size={16} />
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2">{s.title}</h3>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="text-price-display font-display font-black text-primary">{formatPrice(s.price)}</span>
                    <span className="text-body-md font-bold text-primary group-hover:text-accent-strong inline-flex items-center gap-1">Contratar <Icon name="arrow_forward" size={16} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Sidebar banner — flutuante à direita em telas grandes */}
      <aside className="hidden xl:block fixed right-4 top-40 w-[125px] z-30 pointer-events-none [&>*]:pointer-events-auto">
        <div className="rounded-card overflow-hidden opacity-90">
          <BannerSlot slot="sidebar" className="w-full h-[400px]" />
        </div>
      </aside>

      <Footer />
    </>
  )
}

function formatEventDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
  } catch { return dateStr }
}

// ── Mock data (usado como fallback quando a API está fora) ─────────────────
const MOCK_LISTINGS: Listing[] = Array.from({ length: 8 }, (_, i) => ({
  id: `mock-${i}`,
  title: ['Duotone Rebel SLS 10m 2024', 'Core Nexus 3 12m', 'North Orbit 9m 2023', 'Wing F-One Strike V3', 'Cabrinha Switchblade 12m', 'Prancha Wing Foil Naish 85L', 'Trapézio ION Ripper', 'Prancha Bidirecional Liquid Force'][i % 8],
  description: 'Equipamento em excelente estado.',
  price: [12500, 8900, 7200, 6450, 5400, 4800, 1200, 2900][i % 8],
  category: 'kitesurf',
  condition: i % 2 === 0 ? 'new' : 'used',
  status: 'active',
  images: [{ id: '1', ...(() => { const img = ['/imagens/kitesurf-card.webp','/imagens/surfer-card.webp','/imagens/wakesurf-card.webp','/imagens/hero-1-card.webp','/imagens/hero-2-card.webp','/imagens/beach-couple-card.webp'][i % 6]; return { url: img, thumb: img } })(), order: 0 }],
  seller: { id: `seller-${i}`, name: 'Vendedor', isVerified: i % 3 === 0, rating: 4.8, reviewCount: 23 },
  city: ['Florianópolis', 'Fortaleza', 'Ilhabela', 'Jericoacoara', 'Cumbuco', 'Preá', 'Rio de Janeiro', 'Araruama'][i % 8],
  state: ['SC', 'CE', 'SP', 'CE', 'CE', 'CE', 'RJ', 'RJ'][i % 8],
  isBoosted: i < 4,
  viewCount: Math.floor(Math.random() * 200),
  favoriteCount: Math.floor(Math.random() * 50),
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
}))

const MOCK_COURSES: CourseItem[] = [
  { id: 'c1', title: 'Kitesurf Iniciante — 6h de aula prática', price: 890, level: 'Iniciante', image: '/imagens/kitesurf.webp' },
  { id: 'c2', title: 'Evolução Intermediário — Upwind & Transições', price: 1200, level: 'Intermediário', image: '/imagens/surfer.webp' },
  { id: 'c3', title: 'Wingfoil do Zero — 4h intensivo', price: 750, level: 'Iniciante', image: '/imagens/wakesurf.webp' },
]

const MOCK_TRAINING: TrainingItem[] = [
  { id: 't1', title: 'Preparação Física — Performance na água', price: 150, duration: '60 min', trainer: 'Coach Rafael', image: '/imagens/hero-2.webp' },
  { id: 't2', title: 'Fisioterapia Esportiva — Prevenção de lesões', price: 180, duration: '50 min', trainer: 'Dra. Marina', image: '/imagens/hero-1.webp' },
  { id: 't3', title: 'Yoga & Mobilidade para Kitesurfistas', price: 90, duration: '60 min', trainer: 'Instr. Lina', image: '/imagens/beach-couple-card.webp' },
]

const MOCK_PROPERTIES: PropertyItem[] = [
  { id: 'p1', title: 'Casa 3 suítes — Frente mar, Cumbuco', price: 850000, city: 'Caucaia', state: 'CE', image: '/imagens/beach-couple-card.webp' },
  { id: 'p2', title: 'Flat no Preá — 2 quartos, 100m da praia', price: 420000, city: 'Cruz', state: 'CE', image: '/imagens/hero-1-card.webp' },
]

const MOCK_ACCOMMODATIONS: AccommodationItem[] = [
  { id: 'a1', title: 'Pousada Vento Forte — Suíte Master', pricePerNight: 320, city: 'Jericoacoara', image: '/imagens/surfer-card.webp' },
  { id: 'a2', title: 'Vila Kite — Chalé 4 pessoas, pé na areia', pricePerNight: 480, city: 'Preá', image: '/imagens/wakesurf-card.webp' },
]

const MOCK_EVENTS: EventItem[] = [
  { id: 'e1', title: 'Kite Festival Cumbuco 2026 — 3 dias de vento', date: new Date(Date.now() + 14*86400000).toISOString(), city: 'Cumbuco, CE', price: 120, image: '/imagens/hero-1-card.webp' },
  { id: 'e2', title: 'Downwind Jeri — Preá 25km', date: new Date(Date.now() + 30*86400000).toISOString(), city: 'Jericoacoara, CE', price: 80, image: '/imagens/kitesurf.webp' },
  { id: 'e3', title: 'Wingfoil Open Ilhabela', date: new Date(Date.now() + 45*86400000).toISOString(), city: 'Ilhabela, SP', price: 150, image: '/imagens/surfer.webp' },
]

const MOCK_SERVICES: ServiceItem[] = [
  { id: 's1', title: 'Reparo de Kite — Costura e válvula', price: 250, category: 'Manutenção', image: '/imagens/wakesurf-card.webp' },
  { id: 's2', title: 'Revisão completa de barra e linhas', price: 180, category: 'Revisão', image: '/imagens/kitesurf-card.webp' },
  { id: 's3', title: 'Customização de prancha — Arte & resina', price: 400, category: 'Custom', image: '/imagens/hero-2-card.webp' },
]
