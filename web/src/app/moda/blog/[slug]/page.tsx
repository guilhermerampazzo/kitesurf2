'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { blogApi, fashionApi } from '@/lib/api'
import { formatDate, formatPrice } from '@/lib/utils'
import DOMPurify from 'dompurify'
import toast from 'react-hot-toast'

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  coverImage?: string
  category?: string
  tags?: string[]
  viewCount?: number
  publishedAt?: string
  createdAt: string
  author: { id: string; name: string; avatar?: string; isVerified?: boolean }
}

type FashionItem = {
  id: string
  title: string
  price: number
  brand?: string
  category?: string
  size?: string
  images?: string[]
}

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [related, setRelated] = useState<FashionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await blogApi.getBySlug(slug)
        const data = res.data?.data ?? res.data
        setPost(data)
        // fetch related fashion items
        try {
          const fRes = await fashionApi.list({ limit: 4 })
          const fData = fRes.data?.data ?? fRes.data ?? []
          setRelated(Array.isArray(fData) ? fData.slice(0, 4) : [])
        } catch {
          // ignore
        }
      } catch {
        toast.error('Post não encontrado.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    )
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-20 text-center">
          <Icon name="article" size={48} className="text-outline-variant mb-4" />
          <h1 className="text-title-lg font-bold mb-2">Post não encontrado</h1>
          <Link href="/moda" className="text-primary font-bold hover:underline">Voltar para Moda</Link>
        </main>
        <Footer />
      </>
    )
  }

  const safeContent = typeof window !== 'undefined'
    ? DOMPurify.sanitize(post.content, { ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li','h1','h2','h3','h4','img','a','blockquote','span'], ALLOWED_ATTR: ['src','alt','class','href','target','rel'] })
    : post.content

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop mb-24">
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <Icon name="chevron_right" size={16} />
          <Link href="/moda" className="hover:text-primary">Moda</Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-on-surface truncate max-w-xs">{post.title}</span>
        </nav>

        {/* Cover */}
        {post.coverImage && (
          <div className="relative aspect-[16/7] rounded-card overflow-hidden bg-surface-container-low mb-8 photo-scrim">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority sizes="100vw" />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <article className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {post.category && <Badge variant="verified" className="capitalize">{post.category}</Badge>}
              <span className="inline-flex items-center gap-1 text-body-md text-secondary">
                <Icon name="visibility" size={14} /> {post.viewCount ?? 0} visualizações
              </span>
              <span className="inline-flex items-center gap-1 text-body-md text-secondary">
                <Icon name="calendar_today" size={14} /> {formatDate(post.publishedAt ?? post.createdAt)}
              </span>
            </div>

            <h1 className="text-headline-lg md:text-[36px] font-display font-black text-primary leading-tight mb-4">{post.title}</h1>

            {post.excerpt && <p className="text-body-lg md:text-[18px] text-on-surface-variant leading-relaxed border-l-4 border-accent-strong pl-4 mb-6">{post.excerpt}</p>}

            <div className="flex items-center gap-3 py-4 border-y border-outline-variant mb-8">
              <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold overflow-hidden">
                {post.author.avatar ? <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" /> : post.author.name[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-body-md font-bold text-on-surface">{post.author.name}</span>
                  {post.author.isVerified && <Icon name="verified" filled size={14} className="text-primary" />}
                </div>
                <span className="text-label-md text-secondary">Autor</span>
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="ml-auto hidden md:flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((t) => (
                    <Badge key={t} variant="pending">#{t}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="prose prose-neutral max-w-none text-body-lg text-on-surface-variant leading-relaxed
              prose-headings:font-display prose-headings:font-extrabold prose-headings:text-primary
              prose-a:text-primary prose-a:underline hover:prose-a:text-accent-strong
              prose-img:rounded-xl prose-img:shadow-soft
            " dangerouslySetInnerHTML={{ __html: safeContent }} />

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 md:hidden">
                {post.tags.map((t) => <Badge key={t} variant="pending">#{t}</Badge>)}
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-[340px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-6">
              <div className="card-soft p-6">
                <h3 className="text-title-lg font-display font-extrabold text-on-surface mb-4 flex items-center gap-2">
                  <Icon name="shopping_bag" size={18} className="text-primary" />
                  Peças em destaque
                </h3>
                {related.length === 0 ? (
                  <p className="text-body-md text-secondary">Nenhum item relacionado.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {related.map((f) => (
                      <Link key={f.id} href={`/moda/produto/${f.id}`} className="flex gap-3 group">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container-low shrink-0 relative">
                          {f.images && f.images[0] ? (
                            <Image src={f.images[0]} alt={f.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="80px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Icon name="apparel" size={24} className="text-outline-variant" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-body-md font-display font-bold text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors">{f.title}</h4>
                          <div className="text-body-md font-black text-primary">{formatPrice(f.price)}</div>
                          <div className="flex items-center gap-1 text-label-md text-secondary">
                            {f.brand && <span>{f.brand}</span>}
                            {f.size && <><span>·</span><span>{f.size}</span></>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <Link href="/moda" className="mt-4 inline-flex items-center gap-1 text-body-md font-bold text-primary hover:text-accent-strong transition-colors">
                  Ver loja completa <Icon name="arrow_forward" size={16} />
                </Link>
              </div>

              <Link href="/moda" className="flex items-center justify-center gap-2 text-body-md text-secondary hover:text-primary transition-colors">
                <Icon name="arrow_back" size={16} />
                Voltar para Moda
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
