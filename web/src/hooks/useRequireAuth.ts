'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import type { User } from '@/types'

/**
 * Exige sessão válida. Sem token — ou com token expirado/inválido —
 * avisa e manda para o login (com `next` para voltar após entrar).
 * Retorna `checking` para a página exibir loading até decidir.
 */
export function useRequireAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    const next = encodeURIComponent(pathname)
    const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
    if (!token) {
      toast.error('Faça login para continuar.')
      router.replace(`/login?next=${next}`)
      return
    }
    authApi.me()
      .then((r) => {
        if (cancelled) return
        setUser(r.data)
        setChecking(false)
      })
      .catch(() => {
        if (cancelled) return
        localStorage.removeItem('kite_access_token')
        localStorage.removeItem('kite_refresh_token')
        toast.error('Sessão expirada. Faça login novamente.')
        router.replace(`/login?next=${next}`)
      })
    return () => { cancelled = true }
  }, [router, pathname])

  return { user, checking }
}
