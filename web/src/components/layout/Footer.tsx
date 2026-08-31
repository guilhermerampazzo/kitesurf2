import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Icon } from '@/components/ui/Icon'

const COLUMNS = [
  {
    title: 'Marketplace',
    links: [
      { label: 'Kitesurf', href: '/buscar?category=kitesurf' },
      { label: 'Wingfoil', href: '/buscar?category=wingfoil' },
      { label: 'Kitefoil', href: '/buscar?category=kitefoil' },
      { label: 'Kitewave', href: '/buscar?category=kitewave' },
      { label: 'Acessórios', href: '/buscar?category=acessorios' },
    ],
  },
  {
    title: 'Institucional',
    links: [
      { label: 'Sobre Nós', href: '/sobre' },
      { label: 'Termos de Uso', href: '/termos' },
      { label: 'Privacidade', href: '/privacidade' },
      { label: 'Segurança', href: '/seguranca' },
      { label: 'Evento KITE360º', href: '/evento' },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { label: 'Ajuda', href: '/ajuda' },
      { label: 'Contato', href: '/contato' },
      { label: 'Dicas de Segurança', href: '/seguranca' },
      { label: 'Planos', href: '/planos' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="w-full bg-brand-gradient text-white/90 mt-24">
      <div className="max-w-container mx-auto px-margin-desktop py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Logo size={44} href={null} variant="branco" withWordmark wordmarkClassName="!text-white" />
          <p className="text-body-md text-white/70 max-w-xs">
            A maior plataforma de compra e venda de equipamentos náuticos do Brasil.
            Vento a favor do início ao fim.
          </p>
          <div className="flex items-center gap-3 mt-2">
            {['public', 'alternate_email', 'play_circle'].map((ic) => (
              <a
                key={ic}
                href="#"
                aria-label="Rede social KITE360º"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-accent hover:text-accent-ink flex items-center justify-center transition-colors"
              >
                <Icon name={ic} size={20} />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="font-display font-extrabold text-white mb-4">{col.title}</h4>
            <ul className="flex flex-col gap-2.5 text-body-md text-white/70">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-accent transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-container mx-auto px-margin-desktop py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-body-md text-white/50">
            © {new Date().getFullYear()} KITE360º — Marketplace de Esportes Aquáticos. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 text-body-md text-white/50">
            <Icon name="verified_user" size={18} className="text-accent" />
            Compra 100% segura
          </div>
        </div>
      </div>
    </footer>
  )
}
