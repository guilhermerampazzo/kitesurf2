import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { BannerSlot } from '@/components/ads/BannerSlot'

export default function EventoPage() {
  if (process.env.EVENT_MODULE_ENABLED !== 'true' && process.env.NEXT_PUBLIC_EVENT_ENABLED !== 'true') {
    return null
  }

  return (
    <>
      <Header />
      <main className="header-offset mb-unit-xl">
        {/* Hero */}
        <div className="relative bg-brand-gradient text-white py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white to-transparent" />
          <div className="relative max-w-container mx-auto px-margin-desktop text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2 mb-6 text-label-md uppercase tracking-wider font-display font-bold">
              <Icon name="event" size={16} className="text-accent" /> Evento Presencial
            </div>
            <h1 className="text-display-lg font-display font-black mb-4">KITE <span className="accent-word">360º</span></h1>
            <p className="text-headline-md font-bold mb-2">O Maior Encontro de Kitesurf do Norte e Nordeste</p>
            <p className="text-body-lg text-white/75 max-w-2xl mx-auto mb-10">
              Dois dias de adrenalina, negócios, experiências e conexões no universo do kitesurf.
              Na praia, com os melhores atletas, marcas e comunidade do Brasil.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a href="#inscricao">
                <Button size="lg" variant="accent">Garantir minha vaga</Button>
              </a>
              <a href="#programacao">
                <Button size="lg" variant="ghost" className="!border-white/40 !text-white hover:!border-accent hover:!text-accent">Ver programação</Button>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-container mx-auto px-margin-desktop">
          {/* Event info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-10 relative z-10 px-2 mb-20">
            {[
              { icon: 'calendar_today', label: 'Data', value: 'Outubro 2025', sub: '2 dias de evento' },
              { icon: 'location_on',    label: 'Local', value: 'Praia do Cumbuco', sub: 'Caucaia, Ceará' },
              { icon: 'people',         label: 'Público', value: '2.000+', sub: 'Atletas e praticantes' },
            ].map((item) => (
              <div key={item.label} className="card-soft p-6 flex items-center gap-5 hover:-translate-y-1 hover:shadow-float transition-all">
                <div className="trust-chip-icon !w-14 !h-14 shrink-0">
                  <Icon name={item.icon} size={28} />
                </div>
                <div>
                  <div className="text-label-md text-secondary uppercase tracking-wider font-display font-bold">{item.label}</div>
                  <div className="text-title-lg font-display font-extrabold text-primary">{item.value}</div>
                  <div className="text-body-md text-secondary">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Programming */}
          <section id="programacao" className="mb-20">
            <h2 className="text-headline-md font-display font-extrabold text-primary mb-8 section-rule inline-block">Programação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { icon: 'surfing',      title: 'Downwinds Especiais',  desc: 'Percursos exclusivos com atletas profissionais e amadores.' },
                { icon: 'mic',         title: 'Palestras e Painéis',   desc: 'Profissionais do setor, inovações e o futuro do kitesurf.' },
                { icon: 'store',       title: 'Demo Day',              desc: 'Teste os equipamentos mais modernos do mercado.' },
                { icon: 'music_note',  title: 'Shows ao Vivo',         desc: 'Bandas locais e regionais para animar a festa.' },
                { icon: 'handshake',   title: 'Networking',            desc: 'Conecte-se com atletas, marcas e investidores do setor.' },
                { icon: 'security',    title: 'Palestras de Segurança', desc: 'Prevenção de acidentes e boas práticas no esporte.' },
              ].map((item) => (
                <div key={item.title} className="card-soft p-5 flex items-start gap-4 hover:-translate-y-1 hover:shadow-float transition-all">
                  <div className="trust-chip-icon shrink-0">
                    <Icon name={item.icon} size={22} />
                  </div>
                  <div>
                    <div className="text-body-lg font-display font-bold text-on-surface">{item.title}</div>
                    <div className="text-body-md text-secondary">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Banner */}
          <div className="mb-20 rounded-card overflow-hidden">
            <BannerSlot slot="event-top" className="w-full h-32" />
          </div>

          {/* Registration form */}
          <section id="inscricao" className="mb-20">
            <div className="card-soft p-10 max-w-xl mx-auto">
              <h2 className="text-headline-md font-display font-extrabold text-primary mb-2 text-center">Inscreva-se no <span className="accent-word">Evento</span></h2>
              <p className="text-body-md text-secondary text-center mb-8">Vagas limitadas. Garanta a sua agora!</p>

              <form className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-unit-xs">
                    <label className="text-label-md uppercase tracking-wider text-on-surface font-display font-bold">Nome</label>
                    <input placeholder="Seu nome" className="border border-outline-variant rounded-xl px-4 py-2.5 text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(31,71,123,0.12)] bg-surface-container-lowest transition-all" />
                  </div>
                  <div className="flex flex-col gap-unit-xs">
                    <label className="text-label-md uppercase tracking-wider text-on-surface font-display font-bold">WhatsApp</label>
                    <input placeholder="+55 (85) 9..." className="border border-outline-variant rounded-xl px-4 py-2.5 text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(31,71,123,0.12)] bg-surface-container-lowest transition-all" />
                  </div>
                </div>
                <div className="flex flex-col gap-unit-xs">
                  <label className="text-label-md uppercase tracking-wider text-on-surface font-display font-bold">E-mail</label>
                  <input type="email" placeholder="seu@email.com" className="border border-outline-variant rounded-xl px-4 py-2.5 text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(31,71,123,0.12)] bg-surface-container-lowest transition-all" />
                </div>
                <div className="flex flex-col gap-unit-xs">
                  <label className="text-label-md uppercase tracking-wider text-on-surface font-display font-bold">Modalidade</label>
                  <select className="border border-outline-variant rounded-xl px-4 py-2.5 text-body-md focus:outline-none focus:border-primary bg-surface-container-lowest cursor-pointer">
                    <option>Kitesurf</option>
                    <option>Wingfoil</option>
                    <option>Kitefoil</option>
                    <option>Kitewave</option>
                    <option>Visitante / Espectador</option>
                  </select>
                </div>
                <Button type="submit" variant="accent" size="lg" className="w-full mt-2">
                  <Icon name="how_to_reg" size={20} />
                  Garantir minha vaga
                </Button>
              </form>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
