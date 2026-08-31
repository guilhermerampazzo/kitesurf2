'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthCardShell, StatusIcon } from '@/components/ui/AuthCardShell'
import toast from 'react-hot-toast'

function Form() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { toast.error('A senha precisa ter ao menos 8 caracteres.'); return }
    if (password !== confirm) { toast.error('As senhas não conferem.'); return }
    setLoading(true)
    try {
      await authApi.resetPw({ token, password })
      setDone(true)
    } catch {
      toast.error('Link inválido ou expirado. Solicite um novo.')
    } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <StatusIcon icon="lock_reset" tone="success" />
        <h2 className="text-title-lg font-display font-bold text-on-surface">Senha redefinida!</h2>
        <p className="text-body-md text-on-surface-variant">Sua nova senha foi salva com sucesso.</p>
        <Button onClick={() => router.push('/login')} variant="accent" className="w-full">Fazer login</Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Input
        label="Nova senha"
        icon="lock"
        type="password"
        placeholder="Mínimo 8 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        label="Confirmar nova senha"
        icon="lock"
        type="password"
        placeholder="Repita a nova senha"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      <Button type="submit" variant="accent" loading={loading} className="w-full">Redefinir senha</Button>
      <Link href="/login" className="text-center text-body-md text-secondary hover:text-primary transition-colors">
        ← Voltar para o login
      </Link>
    </form>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <AuthCardShell
      title="Definir nova senha"
      subtitle="Crie uma senha forte para sua conta."
    >
      <Suspense>
        <Form />
      </Suspense>
    </AuthCardShell>
  )
}
