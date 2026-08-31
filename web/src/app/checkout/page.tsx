'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

function CheckoutContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [method, setMethod] = useState<'pix' | 'card'>('pix')
  const [loading, setLoading] = useState(false)

  async function pay(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    toast.success('Pagamento realizado com sucesso!')
    router.push('/painel')
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-headline-lg font-display font-black text-primary mb-2 section-rule inline-block">Checkout Seguro</h1>
      <p className="text-body-md text-on-surface-variant mb-10">Finalize sua assinatura com total segurança.</p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Payment form */}
        <div className="flex-1">
          {/* Payment methods */}
          <div className="card-soft p-6 mb-6">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-4">Forma de pagamento</h2>
            <div className="flex gap-3 mb-6">
              {(['pix', 'card'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-display font-bold ${
                    method === m ? 'border-primary bg-primary-fixed text-primary' : 'border-outline-variant hover:border-primary text-secondary'
                  }`}
                >
                  <Icon name={m === 'pix' ? 'qr_code' : 'credit_card'} size={22} className={method === m ? 'text-primary' : 'text-secondary'} />
                  {m === 'pix' ? 'PIX' : 'Cartão'}
                </button>
              ))}
            </div>

            <form onSubmit={pay} className="flex flex-col gap-4">
              {method === 'pix' ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-48 h-48 bg-surface-container border-2 border-outline-variant rounded-2xl flex items-center justify-center">
                    <Icon name="qr_code_2" size={120} className="text-on-surface" />
                  </div>
                  <p className="text-body-md text-secondary text-center">
                    Escaneie o QR code com o app do seu banco para pagar via PIX.
                  </p>
                  <div className="w-full bg-surface-container rounded-xl px-4 py-3 flex items-center gap-3">
                    <code className="flex-1 text-body-md text-on-surface truncate text-[12px]">
                      00020101021126580014br.gov.bcb.pix...kite360.pix.key
                    </code>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText('kite360.pix.key'); toast.success('Código copiado!') }}
                      className="text-primary hover:text-primary-container"
                      aria-label="Copiar código PIX"
                    >
                      <Icon name="content_copy" size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Input label="Número do cartão" icon="credit_card" placeholder="0000 0000 0000 0000" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Validade" placeholder="MM/AA" />
                    <Input label="CVV" placeholder="000" />
                  </div>
                  <Input label="Nome no cartão" placeholder="Como está no cartão" />
                </>
              )}

              <Button type="submit" variant="accent" loading={loading} size="lg" className="w-full mt-2">
                <Icon name="lock" size={18} />
                {method === 'pix' ? 'Confirmar pagamento PIX' : 'Pagar com cartão'}
              </Button>
            </form>
          </div>
        </div>

        {/* Order summary */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="card-soft p-6 sticky top-32">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-4">Resumo do pedido</h2>
            <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-outline-variant">
              <div className="flex justify-between text-body-md">
                <span className="text-secondary">Plano Pro (mensal)</span>
                <span className="font-bold">R$ 29,90</span>
              </div>
              <div className="flex justify-between text-body-md text-green-600">
                <span>Desconto boas-vindas</span>
                <span>- R$ 0,00</span>
              </div>
            </div>
            <div className="flex justify-between text-title-lg font-display font-black text-primary mb-6">
              <span>Total</span>
              <span>R$ 29,90</span>
            </div>

            <div className="flex flex-col gap-2">
              {['Pagamento 100% seguro', 'Cancele quando quiser', 'Nota fiscal por e-mail'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-body-md text-secondary">
                  <Icon name="check_circle" filled size={16} className="text-accent-strong shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="header-offset px-margin-desktop mb-unit-xl max-w-container mx-auto">
        <Suspense>
          <CheckoutContent />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
