'use client'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/api'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { AuthCardShell, StatusIcon } from '@/components/ui/AuthCardShell'

function Content() {
  const params = useSearchParams()
  const token = params.get('token')
  const registered = params.get('registered')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (!token) return
    setStatus('loading')
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  if (registered && !token) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <StatusIcon icon="mark_email_unread" tone="brand" />
        <h2 className="text-title-lg font-display font-bold text-on-surface">Verifique seu e-mail</h2>
        <p className="text-body-md text-on-surface-variant max-w-xs">
          Enviamos um link de verificação para o seu e-mail. Clique no link para ativar sua conta.
        </p>
        <p className="text-label-md text-outline">Não recebeu? Verifique sua caixa de spam.</p>
        <Link href="/login" className="mt-2"><Button variant="accent" className="w-full">Ir para o login</Button></Link>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-body-md text-secondary">Verificando seu e-mail...</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <StatusIcon icon="check_circle" tone="success" />
        <h2 className="text-title-lg font-display font-bold text-on-surface">E-mail verificado!</h2>
        <p className="text-body-md text-on-surface-variant">Sua conta foi ativada com sucesso. Bem-vindo ao KITE360º!</p>
        <Link href="/login" className="mt-2"><Button variant="accent" className="w-full">Fazer login</Button></Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <StatusIcon icon="error" tone="error" />
        <h2 className="text-title-lg font-display font-bold text-on-surface">Link inválido</h2>
        <p className="text-body-md text-on-surface-variant">Este link de verificação expirou ou já foi utilizado.</p>
        <Link href="/login" className="text-primary font-bold hover:text-accent-strong transition-colors">Voltar ao login</Link>
      </div>
    )
  }

  return null
}

export default function VerificarEmailPage() {
  return (
    <AuthCardShell title="Verificação de e-mail">
      <Suspense>
        <Content />
      </Suspense>
    </AuthCardShell>
  )
}
