'use client'
import { useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { authApi } from '@/lib/api'
import type { User } from '@/types'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 'email',    label: 'E-mail verificado',    icon: 'mail',  desc: 'Seu e-mail foi confirmado.' },
  { id: 'document', label: 'Documento (CPF/RG)',   icon: 'badge', desc: 'Envie uma foto do seu documento de identidade.' },
]

export default function VerificacaoContaPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    authApi.me().then((r) => setUser(r.data))
  }, [])

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar userName={user?.name} userAvatar={user?.avatar} />

      <main className="flex-1 p-unit-xl overflow-auto">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-headline-lg font-display font-black text-primary mb-unit-sm">Verificação de Conta</h1>
          <p className="text-body-md text-secondary mb-unit-xl">
            Complete a verificação para obter o Selo Verificado e aumentar sua credibilidade com compradores.
          </p>

          {/* Badge */}
          {user?.isVerified && (
            <div className="bg-primary-fixed border border-outline-variant rounded-xl p-unit-lg mb-unit-xl flex items-center gap-4">
              <Icon name="verified" filled size={40} className="text-primary" />
              <div>
                <div className="text-title-lg font-bold text-primary">Conta Verificada!</div>
                <div className="text-body-md text-secondary">Seu selo de verificação está ativo nos seus anúncios.</div>
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="flex flex-col gap-unit-md">
            {STEPS.map((step, i) => {
              const done = step.id === 'email' ? true : user?.isVerified
              return (
                <div key={step.id} className="card-soft p-unit-lg">
                  <div className="flex items-center gap-unit-md">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${done ? 'bg-green-100' : 'bg-surface-container'}`}>
                      {done
                        ? <Icon name="check_circle" filled size={28} className="text-green-600" />
                        : <Icon name={step.icon} size={24} className="text-outline" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="text-body-md font-bold text-on-surface">{step.label}</div>
                      <div className="text-body-md text-secondary">{step.desc}</div>
                    </div>
                    {done
                      ? <span className="text-label-md text-green-600 font-bold uppercase">Concluído</span>
                      : <span className="text-label-md text-secondary uppercase">Pendente</span>
                    }
                  </div>

                </div>
              )
            })}
          </div>

          {/* Pricing notice */}
          <div className="mt-unit-xl bg-surface-container-low border border-outline-variant rounded-xl p-unit-lg">
            <div className="flex items-start gap-3">
              <Icon name="workspace_premium" size={24} className="text-primary shrink-0" />
              <div>
                <div className="text-body-md font-bold text-on-surface">Selo Verificado Premium</div>
                <div className="text-body-md text-secondary mb-unit-md">
                  Complete todas as etapas e garanta seu selo verificado por apenas <strong>R$ 29,90/ano</strong>.
                  Aumente sua credibilidade e venda muito mais rápido.
                </div>
                <Button variant="secondary" size="sm">Ver planos de verificação</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
