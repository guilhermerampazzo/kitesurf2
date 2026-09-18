'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@/components/ui/Logo'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import toast from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      const res = await authApi.login({ ...data })
      localStorage.setItem('kite_access_token', res.data.accessToken)
      localStorage.setItem('kite_refresh_token', res.data.refreshToken)
      // volta para a página que exigiu login (ex.: /imoveis/criar)
      let next = '/painel'
      try {
        const q = new URLSearchParams(window.location.search).get('next')
        if (q && q.startsWith('/') && !q.startsWith('//')) next = q
      } catch { /* mantém /painel */ }
      router.push(next)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'E-mail ou senha incorretos.')
    }
  }

  return (
    <main className="flex min-h-screen w-full">
      {/* Hero image side */}
      <section className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden bg-[#001e40]">
        <Image src="/imagens/surfer.webp" alt="Surfista" fill priority sizes="60vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,30,64,0.55) 0%, rgba(0,30,64,0.9) 100%)' }} />
        <div className="relative z-10 p-12 flex flex-col justify-end h-full">
          <div className="max-w-md mb-10">
            <Logo size={60} variant="branco" withWordmark={false} className="mb-6" />
            <h2 className="text-headline-lg font-display font-black text-white mb-4 leading-tight">
              Alta performance<br />no <span className="accent-word">mar.</span>
            </h2>
            <p className="text-body-lg text-white/80">
              O marketplace definitivo para kitesurf, wingfoil e esportes aquáticos.
              Encontre equipamentos de elite e venda para quem entende de mar.
            </p>
          </div>
          <div className="flex gap-8">
            {[['verified_user', 'Compra segura'], ['badge', 'Vendedor verificado'], ['support_agent', 'Suporte 7 dias']].map(([icon, label]) => (
              <div key={icon} className="flex flex-col items-center gap-2 text-white/70">
                <Icon name={icon} size={26} className="text-accent" />
                <span className="text-[11px] font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form side */}
      <section className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center bg-surface-container-lowest px-6 md:px-12 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="flex justify-center"><Logo size={54} withWordmark /></div>
            <p className="text-body-md text-secondary mt-2">Bem-vindo de volta — entre na sua conta</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="E-mail"
              icon="alternate_email"
              type="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Senha"
                icon="lock"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 bottom-[10px] text-outline hover:text-on-surface"
              >
                <Icon name={showPw ? 'visibility_off' : 'visibility'} size={20} />
              </button>
            </div>

            <div className="flex justify-end">
              <Link href="/recuperar-senha" className="text-label-md font-semibold text-primary hover:text-accent-strong transition-colors">
                Esqueci minha senha
              </Link>
            </div>

            <Button type="submit" size="lg" variant="accent" loading={isSubmitting} className="w-full">
              <Icon name="login" size={20} />
              Entrar
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-body-md text-secondary">
              Não tem conta?{' '}
              <Link href="/cadastro" className="font-bold text-primary hover:text-accent-strong transition-colors">
                Cadastre-se gratuitamente
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
