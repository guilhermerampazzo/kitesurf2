import { InfoPage, InfoSection } from '@/components/layout/InfoPage'

export const metadata = { title: 'Sobre Nós — KITE360º' }

export default function SobrePage() {
  return (
    <InfoPage icon="public" title={<>Sobre <span className="accent-word">Nós</span></>} subtitle="O marketplace brasileiro de esportes aquáticos.">
      <InfoSection title="Quem somos">
        <p>O <strong>KITE360º</strong> é o marketplace vertical de esportes aquáticos do Brasil: kitesurf, wingfoil, kitefoil, kitewave e acessórios. Nascemos na praia, entre velejadores, com um objetivo simples — tornar a compra e venda de gear segura, rápida e justa para quem vive do vento.</p>
      </InfoSection>
      <InfoSection title="Nossos diferenciais">
        <p><strong>Compra segura:</strong> negociação protegida do primeiro contato ao desembarque.</p>
        <p><strong>Vendedor verificado:</strong> selo de verificação e reputação real da comunidade.</p>
        <p><strong>Chat protegido:</strong> conversa interna com bloqueio de troca de contato externo.</p>
        <p><strong>Comunidade:</strong> escola, treinos, eventos, hospedagem e serviços no mesmo lugar.</p>
      </InfoSection>
    </InfoPage>
  )
}
