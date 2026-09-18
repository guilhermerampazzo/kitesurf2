import { InfoPage, InfoSection } from '@/components/layout/InfoPage'

export const metadata = { title: 'Privacidade — KITE360º' }

export default function PrivacidadePage() {
  return (
    <InfoPage icon="lock" title={<span className="accent-word">Privacidade</span>} subtitle="Como tratamos os seus dados.">
      <InfoSection title="Dados que coletamos">
        <p>Coletamos os dados que você nos fornece (nome, e-mail, anúncios, mensagens) e dados técnicos de navegação para operar e melhorar a plataforma.</p>
      </InfoSection>
      <InfoSection title="Como usamos">
        <p>Usamos seus dados para: operar sua conta e anúncios, viabilizar negociações, enviar comunicações transacionais, prevenir fraudes e cumprir obrigações legais.</p>
      </InfoSection>
      <InfoSection title="Compartilhamento">
        <p>Não vendemos seus dados. Compartilhamos apenas o necessário para operar o serviço (ex.: processamento de pagamentos) ou quando exigido por lei.</p>
      </InfoSection>
      <InfoSection title="Seus direitos">
        <p>Você pode solicitar acesso, correção ou exclusão dos seus dados pessoais a qualquer momento pelo suporte, conforme a LGPD (Lei nº 13.709/2018).</p>
      </InfoSection>
    </InfoPage>
  )
}
