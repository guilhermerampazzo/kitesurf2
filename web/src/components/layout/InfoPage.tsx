import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Icon } from '@/components/ui/Icon'

export function InfoPage({ icon, title, subtitle, children }: { icon: string; title: ReactNode; subtitle: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="header-offset mb-24">
        <div className="relative bg-brand-gradient text-white py-16 overflow-hidden">
          <div className="relative max-w-container mx-auto px-margin-desktop text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-5 py-2 mb-5 text-label-md uppercase tracking-wider font-display font-bold">
              <Icon name={icon} size={16} className="text-accent" /> KITE360º
            </div>
            <h1 className="text-display-md font-display font-black mb-3">{title}</h1>
            <p className="text-body-lg text-white/75 max-w-2xl mx-auto">{subtitle}</p>
          </div>
        </div>
        <div className="max-w-container mx-auto px-margin-desktop mt-12">
          <div className="max-w-3xl mx-auto flex flex-col gap-6 text-body-md text-on-surface-variant leading-relaxed">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card-soft p-6 md:p-8">
      <h2 className="text-title-lg font-display font-extrabold text-primary mb-3">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}
