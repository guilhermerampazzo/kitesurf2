'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { StarRating } from '@/components/ui/StarRating'
import { fashionApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type FashionDetail = {
  id: string
  title: string
  description: string
  category: string
  brand?: string
  size?: string
  color?: string
  condition?: string
  price: number
  images: string[]
  seller: { id: string; name: string; avatar?: string; isVerified?: boolean; rating?: number; reviewCount?: number }
  viewCount?: number
  createdAt?: string
}

export default function FashionProdutoPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<FashionDetail | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isLogged, setIsLogged] = useState<boolean | null>(null)

  useEffect(() => {
    fashionApi.get(id)
      .then((r) => setItem(r.data?.data ?? r.data))
      .catch(() => toast.error('Produto não encontrado.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { setIsLogged(!!localStorage.getItem('kite_access_token')) }, [])

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

  if (!item) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-20 text-center">
          <Icon name="apparel" size={48} className="text-outline-variant mb-4" />
          <h1 className="text-title-lg font-bold">Produto não encontrado</h1>
          <Link href="/moda" className="mt-4 inline-block text-primary font-bold hover:underline">Voltar para Moda</Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop mb-24 pt-2">
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <Icon name="chevron_right" size={16} />
          <Link href="/moda" className="hover:text-primary">Moda</Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-on-surface truncate max-w-xs">{item.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Images */}
          <div className="flex-1 min-w-0">
            <div className="relative aspect-[4/3] rounded-card overflow-hidden bg-surface-container-low mb-3 photo-scrim shadow-soft">
              {item.images.length > 0 ? (
                <Image src={item.images[selectedImage] ?? item.images[0]} alt={item.title} fill className="object-cover" priority sizes="(max-width:1024px) 100vw, 60vw" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="apparel" size={64} className="text-outline-variant" />
                </div>
              )}
              <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10 capitalize">{item.category}</Badge>
              {item.condition && <Badge variant={item.condition === 'new' ? 'new' : 'used'} className="absolute top-3 left-3 z-10">{item.condition === 'new' ? 'Novo' : 'Usado'}</Badge>}
            </div>

            {item.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {item.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${i === selectedImage ? 'border-accent-strong' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8 card-soft p-6">
              <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-4">Descrição</h2>
              <p className="text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>

            {/* Ficha */}
            <div className="mt-6 card-soft p-6">
              <h3 className="text-title-lg font-display font-extrabold text-on-surface mb-4">Detalhes</h3>
              <div className="grid grid-cols-2 gap-3 text-body-md">
                {item.brand && <div className="bg-surface-container rounded-xl px-4 py-3 flex flex-col"><span className="text-label-md uppercase tracking-wider text-secondary font-bold">Marca</span><span className="font-bold text-on-surface">{item.brand}</span></div>}
                {item.size && <div className="bg-surface-container rounded-xl px-4 py-3 flex flex-col"><span className="text-label-md uppercase tracking-wider text-secondary font-bold">Tamanho</span><span className="font-bold text-on-surface">{item.size}</span></div>}
                {item.color && <div className="bg-surface-container rounded-xl px-4 py-3 flex flex-col"><span className="text-label-md uppercase tracking-wider text-secondary font-bold">Cor</span><span className="font-bold text-on-surface capitalize">{item.color}</span></div>}
                {item.condition && <div className="bg-surface-container rounded-xl px-4 py-3 flex flex-col"><span className="text-label-md uppercase tracking-wider text-secondary font-bold">Condição</span><span className="font-bold text-on-surface capitalize">{item.condition === 'new' ? 'Novo' : 'Usado'}</span></div>}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[360px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-4">
              <div className="card-soft p-6">
                <Badge variant={item.condition === 'new' ? 'new' : 'used'} className="mb-3">{item.condition === 'new' ? 'Novo' : 'Usado'}</Badge>
                <h1 className="text-title-lg font-display font-extrabold text-on-surface mb-2 leading-tight">{item.title}</h1>
                {item.brand && <p className="text-body-md text-secondary mb-3 flex items-center gap-2"><Icon name="branding_watermark" size={16} /> {item.brand}{item.size ? ` · Tam ${item.size}` : ''}</p>}
                <div className="text-display-lg font-display font-black text-primary mb-4">{formatPrice(item.price)}</div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {item.category && <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-full text-body-md capitalize font-semibold"><Icon name="category" size={14} /> {item.category}</span>}
                  {item.color && <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-full text-body-md capitalize"><Icon name="palette" size={14} /> {item.color}</span>}
                </div>

                {isLogged === null ? (
                  <div className="h-11 bg-surface-container animate-pulse rounded-full mb-3" />
                ) : isLogged ? (
                  <Button variant="accent" className="w-full mb-3">
                    <Icon name="chat" size={18} />
                    Entrar em contato
                  </Button>
                ) : (
                  <div className="card-soft p-5 bg-brand-gradient text-white mb-3">
                    <p className="font-display font-black text-white flex items-center gap-2"><Icon name="lock" size={16} /> Entre para falar com o vendedor</p>
                    <p className="text-white/80 text-body-md mt-1">Crie sua conta grátis e fale direto com o vendedor.</p>
                    <div className="flex gap-3 mt-4 flex-wrap">
                      <Link href="/login" className="bg-white text-primary px-5 py-2 rounded-full font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5"><Icon name="login" size={16} /> Entrar</Link>
                      <Link href="/cadastro" className="btn-accent px-5 py-2 rounded-full font-bold inline-flex items-center gap-1.5">Criar conta</Link>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-primary-fixed dark:bg-primary-container rounded-xl text-label-md text-on-primary-fixed-variant dark:text-primary-fixed flex items-start gap-2">
                  <Icon name="security" size={16} className="shrink-0 mt-0.5" />
                  Compre com segurança — pagamento protegido pela plataforma.
                </div>
              </div>

              {/* Seller */}
              <div className="card-soft p-6">
                <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-4 font-display font-bold">Vendedor</h3>
                <Link href={`/vendedor/${item.seller.id}`} className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-on-primary font-bold text-lg overflow-hidden">
                    {item.seller.avatar ? <Image src={item.seller.avatar} alt={item.seller.name} width={48} height={48} className="w-full h-full object-cover" /> : item.seller.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-md font-bold text-on-surface group-hover:text-primary transition-colors">{item.seller.name}</span>
                      {item.seller.isVerified && <Icon name="verified" filled size={16} className="text-primary" />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating value={item.seller.rating ?? 0} size={14} />
                      <span className="text-label-md text-secondary">({item.seller.reviewCount ?? 0})</span>
                    </div>
                  </div>
                </Link>
                <Link href={`/vendedor/${item.seller.id}`} className="mt-4 block">
                  <Button variant="ghost" className="w-full">Ver perfil</Button>
                </Link>
              </div>

              <Link href="/moda" className="flex items-center justify-center gap-2 text-body-md text-secondary hover:text-primary transition-colors py-2">
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
