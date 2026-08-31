'use client'
import { useEffect, useState } from 'react'
import { bannersApi } from '@/lib/api'
import type { AdBanner } from '@/types'
import Image from 'next/image'

interface BannerSlotProps {
  slot: string
  className?: string
}

export function BannerSlot({ slot, className }: BannerSlotProps) {
  const [banners, setBanners] = useState<AdBanner[]>([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    bannersApi.forSlot(slot)
      .then((r) => setBanners(r.data.data ?? []))
      .catch(() => {})
  }, [slot])

  const current = banners[idx]

  useEffect(() => {
    if (!current) return
    bannersApi.impression(current.id).catch(() => {})
  }, [current])

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 8000)
    return () => clearInterval(t)
  }, [banners.length])

  if (!current) return null

  function handleClick() {
    bannersApi.click(current.id).catch(() => {})
    window.open(current.linkUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={className}>
      <div
        onClick={handleClick}
        className="relative w-full h-full rounded-lg overflow-hidden cursor-pointer group border border-outline-variant"
        title={`Publicidade — ${current.advertiser}`}
      >
        <Image
          src={current.imageUrl}
          alt={`Publicidade — ${current.advertiser}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="250px"
        />
        <div className="absolute bottom-0 w-full px-3 py-2 bg-[rgba(0,30,64,0.75)] backdrop-blur-sm text-on-primary text-center">
          <div className="text-[9px] uppercase font-bold tracking-widest opacity-70">Publicidade</div>
        </div>
      </div>
    </div>
  )
}
