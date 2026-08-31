'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { listingsApi, authApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { Listing, User } from '@/types'
import toast from 'react-hot-toast'

const BOOST_PLANS = [
  { id: '7d',  label: '7 dias',   price: 19.90, features: ['Topo da busca', 'Badge "Patrocinado"', '3x mais visualizações'] },
  { id: '15d', label: '15 dias',  price: 34.90, features: ['Topo da busca', 'Badge "Patrocinado"', '5x mais visualizações', 'Destaque na home'] },
  { id: '30d', label: '30 dias',  price: 59.90, features: ['Topo da busca', 'Badge "Patrocinado"', '10x mais visualizações', 'Destaque na home', 'Push de notificação para seguidores'], popular: true },
]

export default function ImpulsionarPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [listing, setListing] = useState<Listing | null>(null)
  const [selected, setSelected] = useState('15d')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([authApi.me(), listingsApi.get(id)])
      .then(([u, l]) => { setUser(u.data); setListing(l.data) })
      .catch(() => { toast.error('Anúncio não encontrado.'); router.back() })
  }, [id, router])

  async function boost() {
    const plan = BOOST_PLANS.find((p) => p.id === selected)
    if (!plan) return
    setLoading(true)
    try {
      await listingsApi.boost(id, { plan: selected })
      toast.success(`Anúncio impulsionado por ${plan.label}!`)
      router.push('/painel/anuncios')
    } catch { toast.error('Erro ao impulsionar. Tente novamente.') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar userName={user?.name} userAvatar={user?.avatar} />

      <main className="flex-1 p-unit-xl overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-unit-xl">
            <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
              <Icon name="arrow_back" size={20} />
            </button>
            <h1 className="text-headline-lg font-display font-black text-primary">Impulsionar Anúncio</h1>
          </div>

          {listing && (
            <div className="card-soft p-unit-md mb-unit-xl flex items-center gap-unit-md">
              {listing.images[0] && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container-low shrink-0">
                  <img src={listing.images[0].thumb} alt={listing.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <div className="text-body-md font-bold text-on-surface">{listing.title}</div>
                <div className="text-price-display text-primary font-bold">{formatPrice(listing.price)}</div>
              </div>
            </div>
          )}

          <h2 className="text-title-lg font-bold text-on-surface mb-unit-lg">Escolha o plano</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-unit-md mb-unit-xl">
            {BOOST_PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`relative flex flex-col p-unit-lg rounded-xl border-2 text-left transition-all ${
                  selected === plan.id ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/40'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-label-md font-bold px-3 py-0.5 rounded-full">
                    Mais popular
                  </span>
                )}
                <div className="text-title-lg font-bold text-on-surface mb-1">{plan.label}</div>
                <div className="text-headline-md font-black text-primary mb-unit-md">{formatPrice(plan.price)}</div>
                <ul className="flex flex-col gap-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-body-md text-secondary">
                      <Icon name="check" size={16} className="text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {selected === plan.id && (
                  <Icon name="check_circle" filled size={20} className="text-primary absolute top-3 right-3" />
                )}
              </button>
            ))}
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-unit-lg mb-unit-xl flex items-start gap-3">
            <Icon name="info" size={20} className="text-primary shrink-0 mt-0.5" />
            <p className="text-body-md text-secondary">
              O impulsionamento começa imediatamente após o pagamento. Você pode pausar o anúncio a qualquer momento sem perder os dias restantes.
            </p>
          </div>

          <Button onClick={boost} loading={loading} size="lg" className="w-full">
            <Icon name="rocket_launch" size={20} />
            Impulsionar por {formatPrice(BOOST_PLANS.find((p) => p.id === selected)?.price ?? 0)}
          </Button>
        </div>
      </main>
    </div>
  )
}
