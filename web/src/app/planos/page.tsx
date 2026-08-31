'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { plansApi } from '@/lib/api'
import type { Plan } from '@/types'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const MOCK_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    billingPeriod: 'monthly',
    features: ['5 anúncios ativos', 'Chat interno', 'Favoritos', 'Avaliações'],
    isPopular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.90,
    billingPeriod: 'monthly',
    features: ['20 anúncios ativos', 'Selo Verificado', 'Chat interno', 'Favoritos', 'Avaliações', '2 impulsionamentos/mês', 'Suporte prioritário'],
    isPopular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 59.90,
    billingPeriod: 'monthly',
    features: ['Anúncios ilimitados', 'Selo Verificado Plus', 'Chat interno', 'Favoritos', 'Avaliações', '5 impulsionamentos/mês', 'Destaque permanente', 'Suporte prioritário VIP', 'Divulgação em comunidades WhatsApp'],
    isPopular: false,
  },
]

export default function PlanosPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    plansApi.list()
      .then((r) => r.data.data?.length && setPlans(r.data.data))
      .catch(() => {})
  }, [])

  async function subscribe(planId: string) {
    setLoading(planId)
    try {
      const { data } = await plansApi.checkout({ planId, billing })
      router.push(`/checkout?order=${data.subscription?.id ?? data.orderId}`)
    } catch { toast.error('Faça login para assinar um plano.'); router.push('/login') }
    finally { setLoading(null) }
  }

  const discount = billing === 'annual' ? 0.2 : 0

  return (
    <>
      <Header />
      <main className="header-offset mb-unit-xl">
        <div className="max-w-container mx-auto px-margin-desktop py-unit-xl">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="inline-flex items-center gap-2 text-label-md font-display font-bold uppercase tracking-widest text-accent-strong mb-3">
              <span className="w-8 h-0.5 bg-accent-strong rounded-full" />
              Para vendedores
            </p>
            <h1 className="text-display-lg font-display font-black text-primary mb-4">
              Planos que dão <span className="accent-word">vento</span> nas suas vendas
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto">
              Escolha o plano ideal e venda mais rápido com maior credibilidade.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 bg-surface-container p-1.5 rounded-full mt-8 card-soft !shadow-none">
              {(['monthly', 'annual'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`px-6 py-2 rounded-full text-body-md font-display font-bold transition-all ${
                    billing === b ? 'bg-brand-gradient text-white shadow-soft' : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  {b === 'monthly' ? 'Mensal' : 'Anual · economize 20%'}
                </button>
              ))}
            </div>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => {
              const price = billing === 'annual' ? plan.price * 12 * (1 - discount) / 12 : plan.price
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col p-8 transition-all duration-300 ${
                    plan.isPopular
                      ? 'bg-brand-gradient text-white rounded-card shadow-float md:-translate-y-3'
                      : 'card-soft hover:-translate-y-1 hover:shadow-float'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 btn-accent text-accent-ink font-display font-extrabold text-label-md px-5 py-1.5 rounded-full shadow-soft whitespace-nowrap">
                      ⭐ Mais escolhido
                    </div>
                  )}

                  <h2 className={`text-title-lg font-display font-extrabold mb-2 ${plan.isPopular ? 'text-white' : 'text-on-surface'}`}>{plan.name}</h2>
                  <div className="mb-8">
                    <span className={`text-[40px] font-display font-black leading-none ${plan.isPopular ? 'text-accent' : 'text-primary'}`}>
                      {price === 0 ? 'Grátis' : formatPrice(price)}
                    </span>
                    {price > 0 && <span className={`text-body-md ${plan.isPopular ? 'text-white/60' : 'text-secondary'}`}>/mês</span>}
                    {billing === 'annual' && price > 0 && (
                      <div className={`text-label-md mt-2 ${plan.isPopular ? 'text-accent' : 'text-green-600'}`}>Cobrado anualmente — economia de 20%</div>
                    )}
                  </div>

                  <ul className="flex flex-col gap-3 flex-1 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-center gap-3 text-body-md ${plan.isPopular ? 'text-white/90' : 'text-on-surface'}`}>
                        <Icon name="check_circle" filled size={18} className={plan.isPopular ? 'text-accent shrink-0' : 'text-accent-strong shrink-0'} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => subscribe(plan.id)}
                    loading={loading === plan.id}
                    variant={plan.isPopular ? 'accent' : 'primary'}
                    size="lg"
                    className="w-full"
                  >
                    {price === 0 ? 'Começar grátis' : 'Assinar agora'}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* FAQ / trust */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'credit_card', title: 'Pagamento seguro', desc: 'PIX, cartão de crédito ou boleto. Seus dados são criptografados.' },
              { icon: 'cancel', title: 'Cancele quando quiser', desc: 'Sem fidelidade. Cancele a qualquer momento, sem multas.' },
              { icon: 'support_agent', title: 'Suporte humano', desc: 'Equipe de suporte disponível por chat e e-mail.' },
            ].map((item) => (
              <div key={item.title} className="card-soft p-6 flex items-start gap-4">
                <span className="trust-chip-icon shrink-0">
                  <Icon name={item.icon} size={24} />
                </span>
                <div>
                  <div className="text-body-md font-display font-bold text-on-surface">{item.title}</div>
                  <div className="text-body-md text-on-surface-variant">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
