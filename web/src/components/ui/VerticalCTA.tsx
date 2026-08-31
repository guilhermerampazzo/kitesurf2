'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { Button } from './Button'

interface VerticalGuestBannerProps {
  vertical: 'escola' | 'treino' | 'imoveis' | 'hospedagem' | 'moda' | 'veiculos' | 'eventos' | 'servicos'
  createHref: string
  createLabel: string
  createIcon?: string
  mineHref?: string
  mineLabel?: string
  mineIcon?: string
}

const COPY: Record<string, { title: string; desc: string }> = {
  escola:     { title: 'Quer ensinar e ganhar com seu conhecimento?', desc: 'Crie cursos em vídeo, organize por playlists e monetize. Você define se é gratuito ou pago — a plataforma cuida da comissão.' },
  treino:     { title: 'É personal ou tem academia?', desc: 'Ofereça horários, gerencie agenda e receba por treino. A Kite360 cuida do agendamento e do pagamento.' },
  imoveis:    { title: 'Tem imóvel para vender ou alugar?', desc: 'Anuncie para quem busca viver perto do vento. Fotos, mapa e contato direto com quem procura.' },
  hospedagem: { title: 'Tem pousada, hotel ou casa de temporada?', desc: 'Cadastre sua hospedagem, defina preço por noite e receba reservas com calendário e pagamento integrados.' },
  moda:       { title: 'Cria conteúdo ou vende moda?', desc: 'Publique no blog e venda no grid. Conecte editorial e loja numa só vitrine.' },
  veiculos:   { title: 'Vendendo carro, moto ou lancha?', desc: 'Anuncie com ficha técnica completa e alcance quem vive o lifestyle do vento.' },
  eventos:    { title: 'Vai organizar um evento?', desc: 'Crie, venda ingressos com QR + código backup e faça check-in por câmera. Destaque por R$99,90.' },
  servicos:   { title: 'Oferece algum serviço?', desc: 'Cadastre fotografia, manutenção, design… Defina preço fixo ou por hora e receba por quantidade.' },
}

export function VerticalCTA({ vertical, createHref, createLabel, createIcon = 'add', mineHref, mineLabel, mineIcon = 'auto_stories' }: VerticalGuestBannerProps) {
  const [isLogged, setIsLogged] = useState<boolean | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
    if (!token) { setIsLogged(false); return }
    // tenta validar token; se falhar, trata como deslogado
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setIsLogged(r.ok))
      .catch(() => setIsLogged(!!token))
  }, [])

  if (isLogged === null) {
    return (
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-10 w-32 bg-surface-container rounded-full animate-pulse" />
        <div className="h-10 w-36 bg-surface-container rounded-full animate-pulse" />
      </div>
    )
  }

  if (isLogged) {
    return (
      <div className="flex items-center gap-3 shrink-0">
        {mineHref && mineLabel && (
          <Link
            href={mineHref}
            className="inline-flex items-center gap-2 border-2 border-outline-variant text-on-surface font-display font-bold px-5 py-2.5 rounded-full hover:border-primary hover:text-primary transition-colors text-body-md"
          >
            <Icon name={mineIcon} size={18} />
            {mineLabel}
          </Link>
        )}
        <Link
          href={createHref}
          className="btn-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-display font-extrabold text-body-md shadow-soft hover:shadow-float transition-shadow"
        >
          <Icon name={createIcon} size={18} />
          {createLabel}
        </Link>
      </div>
    )
  }

  const copy = COPY[vertical]
  return (
    <div className="w-full card-soft !p-0 overflow-hidden flex flex-col md:flex-row items-stretch">
      <div className="flex-1 p-6">
        <div className="inline-flex items-center gap-2 text-label-md font-display font-bold uppercase tracking-wider text-accent mb-1">
          <Icon name="lock" size={14} />
          Exclusivo para cadastrados
        </div>
        <h3 className="text-title-lg font-display font-extrabold text-on-surface leading-snug">{copy.title}</h3>
        <p className="text-body-md text-on-surface-variant mt-1 max-w-xl">{copy.desc}</p>
      </div>
      <div className="flex items-center gap-3 p-6 bg-surface-container-low md:border-l border-outline-variant shrink-0">
        <Link href="/login" className="inline-flex items-center gap-2 border-2 border-outline-variant text-on-surface font-display font-bold px-5 py-2.5 rounded-full hover:border-primary hover:text-primary transition-colors text-body-md">
          Entrar
        </Link>
        <Link href="/cadastro" className="btn-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-display font-extrabold text-body-md">
          Criar conta grátis
        </Link>
      </div>
    </div>
  )
}

// Versão compacta só com os botões (sem banner) — para usar dentro do header da página quando quiser só esconder
export function ProtectedCreateButton({ href, label, icon = 'add' }: { href: string; label: string; icon?: string }) {
  const [isLogged, setIsLogged] = useState<boolean | null>(null)
  useEffect(() => {
    setIsLogged(!!localStorage.getItem('kite_access_token'))
  }, [])
  if (!isLogged) return null
  return (
    <Link href={href} className="btn-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-display font-extrabold text-body-md">
      <Icon name={icon} size={18} />
      {label}
    </Link>
  )
}
