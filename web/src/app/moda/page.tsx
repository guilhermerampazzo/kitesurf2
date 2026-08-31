'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { blogApi, fashionApi } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string
  coverImage?: string
  category?: string
  tags?: string[]
  viewCount?: number
  publishedAt?: string
  createdAt?: string
  author?: { id: string; name: string; avatar?: string }
}

type FashionItem = {
  id: string
  title: string
  description?: string
  category?: string
  brand?: string
  size?: string
  color?: string
  condition?: string
  price: number
  images?: string[]
  status?: string
  seller?: { id: string; name: string; avatar?: string; isVerified?: boolean }
  createdAt?: string
}

export default function ModaPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [items, setItems] = useState<FashionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'todos' | 'blog' | 'loja'>('todos')

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const [bRes, fRes] = await Promise.all([
          blogApi.list({ category: 'moda', limit: 6 }),
          fashionApi.list({ limit: 12 }),
        ])
        const bData = bRes.data?.data ?? bRes.data ?? []
        const fData = fRes.data?.data ?? fRes.data ?? []
        setPosts(Array.isArray(bData) ? bData : [])
        setItems(Array.isArray(fData) ? fData : [])
      } catch {
        toast.error('Erro ao carregar conteúdo de moda.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24">
        {/* Hero */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-headline-lg font-display font-black text-primary section-rule inline-block">
              <span className="accent-word">Moda</span> Kite Style
            </h1>
            <p className="text-body-lg text-on-surface-variant mt-4 max-w-xl">
              Editorial com tendências da praia à cidade e loja com peças para vestir o lifestyle do vento.
            </p>
          </div>
          <Link href="/moda/criar" className="btn-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-display font-extrabold text-body-md shadow-soft hover:shadow-float transition-shadow shrink-0">
            <Icon name="add" size={18} />
            Criar publicação / produto
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'todos', label: 'Tudo', icon: 'apps' },
            { id: 'blog', label: 'Blog editorial', icon: 'article' },
            { id: 'loja', label: 'Loja', icon: 'shopping_bag' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-body-md font-display font-bold transition-colors shrink-0 ${activeTab === tab.id ? 'bg-brand-gradient text-white shadow-soft' : 'bg-surface-container border border-outline-variant text-on-surface hover:border-primary hover:text-primary'}`}
            >
              <Icon name={tab.icon} size={18} filled={activeTab === tab.id} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Blog editorial section */}
            {(activeTab === 'todos' || activeTab === 'blog') && (
              <section className="mb-12">
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-headline-md font-display font-black text-primary inline-flex items-center gap-2">
                      <Icon name="article" size={24} className="text-accent-strong" />
                      Blog <span className="accent-word">editorial</span>
                    </h2>
                    <p className="text-body-md text-secondary mt-1">Tendências, entrevistas e kite style.</p>
                  </div>
                  <Link href="/moda/blog" className="hidden md:inline-flex items-center gap-1 text-body-md font-bold text-primary hover:text-accent-strong transition-colors">
                    Ver todos
                    <Icon name="arrow_forward" size={16} />
                  </Link>
                </div>

                {posts.length === 0 ? (
                  <div className="card-soft p-10 text-center">
                    <Icon name="article" size={40} className="text-outline-variant mb-3" />
                    <p className="text-body-md text-secondary mb-4">Nenhum post editorial ainda. Seja o primeiro a publicar!</p>
                    <Link href="/moda/criar">
                      <Button variant="accent" size="sm">
                        <Icon name="add" size={16} />
                        Criar post
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    {posts.map((p) => (
                      <Link key={p.id} href={`/moda/blog/${p.slug}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                        <div className="aspect-[16/10] bg-surface-container-low overflow-hidden relative photo-scrim">
                          {p.coverImage ? (
                            <Image src={p.coverImage} alt={p.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                          ) : (
                            <div className="absolute inset-0 bg-brand-gradient opacity-20" />
                          )}
                          {p.category && <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10 capitalize">{p.category}</Badge>}
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2 leading-snug">{p.title}</h3>
                          {p.excerpt && <p className="text-body-md text-secondary line-clamp-2 mt-2">{p.excerpt}</p>}
                          <div className="flex items-center gap-2 mt-4 text-label-md text-secondary">
                            {p.author?.avatar ? <img src={p.author.avatar} alt={p.author.name} className="w-6 h-6 rounded-full object-cover" /> : <Icon name="person" size={14} />}
                            <span className="truncate">{p.author?.name ?? 'KITE360º'}</span>
                            <span className="mx-1">·</span>
                            <span>{formatDate(p.publishedAt ?? p.createdAt ?? new Date().toISOString())}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Loja section */}
            {(activeTab === 'todos' || activeTab === 'loja') && (
              <section>
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-headline-md font-display font-black text-primary inline-flex items-center gap-2">
                      <Icon name="shopping_bag" size={24} className="text-primary" />
                      Loja <span className="accent-word">fashion</span>
                    </h2>
                    <p className="text-body-md text-secondary mt-1">Peças novas e seminovas para o seu dia a dia.</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <Badge variant="verified">{items.length} itens</Badge>
                  </div>
                </div>

                {items.length === 0 ? (
                  <EmptyState icon="apparel" title="Nenhum item na loja" description="Nenhum produto cadastrado ainda. Seja o primeiro a vender!" actionLabel="Criar produto" actionHref="/moda/criar" />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                    {items.map((item) => (
                      <Link key={item.id} href={`/moda/produto/${item.id}`} className="card-soft overflow-hidden product-card-hover flex flex-col group">
                        <div className="aspect-[4/3] bg-surface-container-low overflow-hidden relative photo-scrim">
                          {item.images && item.images[0] ? (
                            <Image src={item.images[0]} alt={item.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500" sizes="(max-width:768px) 50vw, 25vw" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon name="apparel" size={48} className="text-outline-variant" />
                            </div>
                          )}
                          <Badge variant="onphoto" className="absolute top-3 left-3 z-10 capitalize">{item.category ?? 'moda'}</Badge>
                          {item.condition && <Badge variant={item.condition === 'new' ? 'new' : 'used'} className="absolute bottom-3 left-3 z-10">{item.condition === 'new' ? 'Novo' : 'Usado'}</Badge>}
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="text-title-lg font-display font-extrabold text-on-surface line-clamp-2 leading-snug mb-1">{item.title}</h3>
                          <div className="flex items-center gap-2 text-[11px] text-secondary mb-2">
                            {item.brand && <span className="font-bold uppercase tracking-wider">{item.brand}</span>}
                            {item.size && <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-full">Tam: {item.size}</span>}
                          </div>
                          <div className="mt-auto text-price-display font-display font-black text-primary">{formatPrice(item.price)}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
