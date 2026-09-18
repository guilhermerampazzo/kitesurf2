import { InfoPage, InfoSection } from '@/components/layout/InfoPage'

export const metadata = { title: 'Termos de Uso — KITE360º' }

export default function TermosPage() {
  return (
    <InfoPage icon="description" title={<>Termos de <span className="accent-word">Uso</span></>} subtitle="Regras para usar a plataforma com segurança.">
      <InfoSection title="1. A plataforma">
        <p>O KITE360º é um marketplace que conecta compradores e vendedores de equipamentos e serviços de esportes aquáticos. Anúncios são de responsabilidade de quem os publica.</p>
      </InfoSection>
      <InfoSection title="2. Conta do usuário">
        <p>Você é responsável por manter sua senha em sigilo e pelas atividades da sua conta. É proibido criar contas falsas ou se passar por outra pessoa.</p>
      </InfoSection>
      <InfoSection title="3. Anúncios">
        <p>Anúncios devem conter informações verdadeiras, fotos reais do produto e preço correto. É proibido anunciar produtos ilícitos, falsificados ou que você não possua.</p>
      </InfoSection>
      <InfoSection title="4. Negociações e chat">
        <p>As negociações devem ocorrer dentro do chat da plataforma. A troca de contatos externos (telefone, e-mail, redes sociais) pelo chat é bloqueada por segurança e pode gerar penalidades.</p>
      </InfoSection>
      <InfoSection title="5. Penalidades">
        <p>Descumprimento destes termos pode resultar em remoção de anúncios, suspensão ou banimento da conta, sem aviso prévio em casos graves.</p>
      </InfoSection>
    </InfoPage>
  )
}
