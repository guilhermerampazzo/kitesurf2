'use client'
import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { Icon } from '@/components/ui/Icon'
import { adminApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Stats {
  totalUsers: number
  totalListings: number
  activeListings?: number
  pendingReports: number
  bannerImpressions?: number
  revenueMonth?: number
  newUsersToday: number
  blockedMessages?: number
  verifiedUsers?: number
  bannedUsers: number
  activeAds: number
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    adminApi.stats()
      .then((r) => setStats(r.data))
      .catch(() => { toast.error('Acesso não autorizado.'); router.push('/login') })
  }, [router])

  const STAT_CARDS = stats ? [
    { label: 'Usuários',            value: stats.totalUsers,          icon: 'group',         color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'Total de anúncios',  value: stats.totalListings,       icon: 'sell',          color: 'text-green-600',   bg: 'bg-green-50' },
    { label: 'Denúncias pendentes',value: stats.pendingReports,      icon: 'gavel',         color: 'text-red-600',     bg: 'bg-red-50' },
    { label: 'Banners ativos',     value: stats.activeAds,           icon: 'ad_units',      color: 'text-purple-600',  bg: 'bg-purple-50' },
    { label: 'Novos hoje',         value: stats.newUsersToday,       icon: 'person_add',    color: 'text-cyan-600',    bg: 'bg-cyan-50' },
    { label: 'Usuários banidos',   value: stats.bannedUsers,         icon: 'block',         color: 'text-orange-600',  bg: 'bg-orange-50' },
  ] : []

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-unit-xl overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-unit-xl">
            <h1 className="text-headline-lg font-display font-black text-primary section-rule inline-block">Painel Administrativo</h1>
            <p className="text-body-md text-secondary mt-4">Visão geral da plataforma</p>
          </div>

          {!stats ? (
            <div className="flex items-center justify-center py-unit-xl">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-unit-md mb-unit-xl">
                {STAT_CARDS.map((c) => (
                  <div key={c.label} className="card-soft p-unit-lg">
                    <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
                      <Icon name={c.icon} size={22} className={c.color} />
                    </div>
                    <div className="text-headline-md font-display font-black text-on-surface">{c.value}</div>
                    <div className="text-label-md text-secondary uppercase tracking-wider mt-1">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-unit-md">
                {[
                  { label: 'Ver denúncias pendentes',    href: '/admin/moderacao', icon: 'gavel',     urgent: stats.pendingReports > 0 },
                  { label: 'Gerenciar banners',          href: '/admin/banners',   icon: 'ad_units',  urgent: false },
                  { label: 'Lista de usuários',          href: '/admin/usuarios',  icon: 'group',     urgent: false },
                ].map((a) => (
                  <a
                    key={a.href}
                    href={a.href}
                    className={`flex items-center gap-3 p-unit-lg bg-surface-container-lowest rounded-xl border-2 hover:shadow-lift transition-all ${
                      a.urgent ? 'border-error' : 'border-outline-variant hover:border-primary'
                    }`}
                  >
                    <Icon name={a.icon} size={24} className={a.urgent ? 'text-error' : 'text-primary'} />
                    <span className={`text-body-md font-bold ${a.urgent ? 'text-error' : 'text-on-surface'}`}>{a.label}</span>
                    {a.urgent && (
                      <span className="ml-auto bg-error text-on-error text-label-md font-bold px-2 py-0.5 rounded-full">
                        {stats.pendingReports}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
