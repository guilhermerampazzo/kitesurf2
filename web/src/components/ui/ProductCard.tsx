'use client'
import Link from 'next/link'
import Image from 'next/image'
import { cn, formatPrice } from '@/lib/utils'
import type { Listing } from '@/types'
import { Icon } from './Icon'
import { Badge } from './Badge'
import { useState } from 'react'
import { favoritesApi } from '@/lib/api'

interface ProductCardProps {
  listing: Listing
  className?: string
}

export function ProductCard({ listing, className }: ProductCardProps) {
  const [fav, setFav] = useState(listing.isFavorited ?? false)

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault()
    setFav(!fav)
    try {
      await favoritesApi.toggle(listing.id)
    } catch {
      setFav(!fav)
    }
  }

  const thumb = listing.images[0]?.thumb ?? listing.images[0]?.url ?? '/placeholder-product.svg'

  return (
    <Link
      href={`/anuncio/${listing.id}`}
      className={cn(
        'group card-soft overflow-hidden product-card-hover flex flex-col relative',
        className
      )}
    >
      <div className="aspect-[4/3] bg-surface-container-low overflow-hidden relative photo-scrim">
        <Image
          src={thumb}
          alt={listing.title}
          fill
          className="object-cover group-hover:scale-[1.06] transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {listing.isBoosted && (
          <Badge variant="sponsored" className="absolute top-3 left-3 z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Destaque
          </Badge>
        )}
        <Badge variant="onphoto" className="absolute bottom-3 left-3 z-10">
          {listing.condition === 'new' ? 'Novo' : 'Usado'}
        </Badge>
        <button
          onClick={toggleFav}
          className="absolute top-2.5 right-2.5 z-10 p-2 bg-white/85 backdrop-blur-sm rounded-full transition-all hover:bg-white hover:scale-110 active:scale-95"
          aria-label={fav ? 'Remover dos favoritos' : 'Favoritar'}
        >
          <Icon name="favorite" filled={fav} size={20} className={fav ? 'text-error' : 'text-secondary'} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-display font-bold uppercase tracking-wider text-outline">
            {listing.category}
          </span>
          {listing.seller.isVerified && (
            <div className="flex items-center gap-0.5 text-on-primary-fixed-variant">
              <Icon name="verified" filled size={14} />
              <span className="text-[10px] font-bold uppercase">Verif.</span>
            </div>
          )}
        </div>

        <h3 className="text-title-lg font-display font-extrabold text-on-surface mb-2 line-clamp-2 leading-snug">
          {listing.title}
        </h3>

        <div className="mt-auto">
          <div className="text-price-display font-display font-black text-primary">{formatPrice(listing.price)}</div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-[11px] text-outline flex items-center gap-1">
              <Icon name="location_on" size={14} />
              {listing.city}, {listing.state}
            </div>
            {listing.seller.rating != null && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant">
                <Icon name="star" filled size={14} className="text-amber-400" />
                {listing.seller.rating.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
