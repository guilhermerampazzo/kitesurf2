import { InfoPage, InfoSection } from '@/components/layout/InfoPage'

export const metadata = { title: 'Contato — KITE360º' }

export default function ContatoPage() {
  return (
    <InfoPage icon="alternate_email" title={<span className="accent-word">Contato</span>} subtitle="Fale com a equipe KITE360º.">
      <InfoSection title="Suporte">
        <p>Precisa de ajuda com um anúncio, pagamento ou denúncia? Nosso suporte responde em horário comercial, 7 dias por semana.</p>
        <p>Use o chat da plataforma após o login ou escreva para o e-mail de atendimento informado nos comunicados oficiais. Nunca peça suporte por canais não oficiais.</p>
      </InfoSection>
      <InfoSection title="Anunciantes e parcerias">
        <p>Quer anunciar sua marca nos banners premium, patrocinar o evento KITE360º ou divulgar nos grupos oficiais? Fale com nosso time comercial pelo painel do anunciante.</p>
      </InfoSection>
    </InfoPage>
  )
}
