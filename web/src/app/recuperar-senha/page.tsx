'use client'
import { useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthCardShell, StatusIcon } from '@/components/ui/AuthCardShell'
import toast from 'react-hot-toast'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPw(email)
      setSent(true)
    } catch {
      toast.error('Erro ao enviar e-mail. Verifique o endereço informado.')
    } finally { setLoading(false) }
  }

  return (
    <AuthCardShell
      title="Recuperar senha"
      subtitle="Informe seu e-mail e enviaremos um link para redefinir sua senha."
    >
      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <StatusIcon icon="mark_email_read" tone="success" />
          <h2 className="text-title-lg font-display font-bold text-on-surface">E-mail enviado!</h2>
          <p className="text-body-md text-on-surface-variant">
            Se encontrarmos uma conta com o e-mail <strong>{email}</strong>, você receberá as instruções em breve.
            Verifique também sua caixa de spam.
          </p>
          <Link href="/login" className="text-primary font-bold hover:text-accent-strong transition-colors text-body-md">
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <Input
            label="E-mail cadastrado"
            icon="alternate_email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" variant="accent" loading={loading} className="w-full">
            Enviar link de recuperação
          </Button>
          <Link href="/login" className="text-center text-body-md text-secondary hover:text-primary transition-colors">
            ← Voltar para o login
          </Link>
        </form>
      )}
    </AuthCardShell>
  )
}
