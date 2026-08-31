'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { StarRating } from '@/components/ui/StarRating'
import { ReportModal } from '@/components/report/ReportModal'
import { listingsApi, chatApi, favoritesApi } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Listing } from '@/types'
import DOMPurify from 'dompurify'
import toast from 'react-hot-toast'

const MapView = dynamic(() => import('@/components/ui/MapView'), { ssr: false })

export default function AnuncioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [fav, setFav] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    listingsApi.get(id)
      .then((r) => { setListing(r.data); setFav(r.data.isFavorited ?? false) })
      .catch(() => toast.error('Anúncio não encontrado.'))
  }, [id])

  async function toggleFav() {
    setFav(!fav)
    try { await favoritesApi.toggle(id) }
    catch { setFav(!fav) }
  }

  async function startConversation() {
    setContactLoading(true)
    try {
      const { data } = await chatApi.startConv(id)
      router.push(`/mensagens?conv=${data.id}`)
    } catch {
      toast.error('Faça login para enviar mensagens.')
      router.push('/login')
    } finally { setContactLoading(false) }
  }

  if (!listing) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-unit-xl flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    )
  }

  const safeDescription = typeof window !== 'undefined'
    ? DOMPurify.sanitize(listing.description, { ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li','h1','h2','h3','img'], ALLOWED_ATTR: ['src','alt','class'] })
    : listing.description

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop mb-unit-xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-unit-lg">
          <Link href="/" className="hover:text-primary">Home</Link>
          <Icon name="chevron_right" size={16} />
          <Link href={`/buscar?category=${listing.category}`} className="hover:text-primary capitalize">{listing.category}</Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-on-surface truncate max-w-xs">{listing.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-unit-xl">
          {/* Images */}
          <div className="flex-1 min-w-0">
            <div className="relative aspect-[4/3] rounded-card overflow-hidden bg-surface-container-low mb-3 photo-scrim shadow-soft">
              {listing.images.length > 0 ? (
                <Image
                  src={listing.images[selectedImage]?.url ?? '/placeholder-product.svg'}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="image_not_supported" size={48} className="text-outline-variant" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 z-10 flex gap-2">
                {listing.isBoosted && (
                  <Badge variant="sponsored">Destaque</Badge>
                )}
                <Badge variant="onphoto">{listing.condition === 'new' ? 'Novo' : 'Usado'}</Badge>
              </div>
            </div>

            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {listing.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${i === selectedImage ? 'border-accent-strong' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <Image src={img.thumb} alt="" width={64} height={64} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-unit-xl">
              <h2 className="text-title-lg font-bold text-on-surface mb-unit-md">Descrição</h2>
              <div
                className="text-body-lg text-on-surface-variant leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: safeDescription }}
              />
            </div>

            {/* Map */}
            {listing.lat && listing.lng && (
              <div className="mt-unit-xl">
                <h2 className="text-title-lg font-bold text-on-surface mb-unit-md">Localização aproximada</h2>
                <MapView lat={listing.lat} lng={listing.lng} label={`${listing.city}, ${listing.state}`} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[340px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-unit-md">
              <div className="card-soft p-6">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={listing.condition === 'new' ? 'new' : 'used'}>
                    {listing.condition === 'new' ? 'Novo' : 'Usado'}
                  </Badge>
                  <button onClick={toggleFav} className="p-2 rounded-full hover:bg-surface-container transition-colors">
                    <Icon name="favorite" filled={fav} size={22} className={fav ? 'text-error' : 'text-secondary'} />
                  </button>
                </div>

                <h1 className="text-title-lg font-display font-extrabold text-on-surface mb-2">{listing.title}</h1>
                <div className="text-display-lg font-display font-black text-primary mb-unit-md">{formatPrice(listing.price)}</div>

                <div className="flex items-center gap-2 text-body-md text-secondary mb-unit-lg">
                  <Icon name="location_on" size={16} />
                  {listing.city}, {listing.state}
                  <span className="text-outline-variant">·</span>
                  <span>{formatDate(listing.createdAt)}</span>
                </div>

                <Button onClick={startConversation} variant="accent" loading={contactLoading} className="w-full mb-3">
                  <Icon name="chat" size={18} />
                  Entrar em contato
                </Button>

                <div className="p-3 bg-primary-fixed dark:bg-primary-container rounded-xl text-label-md text-on-primary-fixed-variant dark:text-primary-fixed flex items-start gap-2">
                  <Icon name="security" size={16} className="shrink-0 mt-0.5" />
                  Por segurança, nunca compartilhe contatos fora da plataforma.
                </div>
              </div>

              {/* Seller card */}
              <div className="card-soft p-6">
                <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-unit-md font-display font-bold">Vendedor</h3>
                <Link href={`/vendedor/${listing.seller.id}`} className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold text-lg overflow-hidden">
                    {listing.seller.avatar
                      ? <Image src={listing.seller.avatar} alt={listing.seller.name} width={48} height={48} className="w-full h-full object-cover" />
                      : listing.seller.name[0].toUpperCase()
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-md font-bold text-on-surface group-hover:text-primary transition-colors">
                        {listing.seller.name}
                      </span>
                      {listing.seller.isVerified && (
                        <Icon name="verified" filled size={16} className="text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating value={listing.seller.rating} size={14} />
                      <span className="text-label-md text-secondary">({listing.seller.reviewCount})</span>
                    </div>
                  </div>
                </Link>
                <div className="mt-unit-md flex gap-2">
                  <Link href={`/vendedor/${listing.seller.id}`} className="flex-1">
                    <Button variant="ghost" className="w-full">Ver perfil</Button>
                  </Link>
                </div>
              </div>

              {/* Report */}
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-2 text-body-md text-secondary hover:text-error transition-colors py-2 self-center"
              >
                <Icon name="flag" size={16} />
                Denunciar anúncio
              </button>
            </div>
          </aside>
        </div>
      </main>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="listing"
        targetId={listing.id}
        targetName={listing.title}
      />

      <Footer />
    </>
  )
}
