import { InfoPage, InfoSection } from '@/components/layout/InfoPage'

export const metadata = { title: 'Segurança — KITE360º' }

export default function SegurancaPage() {
  return (
    <InfoPage icon="verified_user" title={<span className="accent-word">Segurança</span>} subtitle="Negocie com proteção do início ao desembarque.">
      <InfoSection title="Dicas de segurança">
        <p><strong>Negocie dentro da plataforma:</strong> todo o histórico fica registrado e protege você.</p>
        <p><strong>Nunca compartilhe contatos pelo chat:</strong> telefone, e-mail e redes sociais são bloqueados automaticamente.</p>
        <p><strong>Desconfie de preços absurdos:</strong> ofertas muito abaixo do mercado costumam ser golpe.</p>
        <p><strong>Prefira vendedores verificados:</strong> o selo indica identidade e reputação checadas.</p>
        <p><strong>Não pague adiantado sem garantia:</strong> use os meios de pagamento com proteção.</p>
      </InfoSection>
      <InfoSection title="Denúncias">
        <p>Viu algo suspeito? Use o botão <strong>Denunciar</strong> no anúncio ou no perfil. Nossa moderação analisa todas as denúncias e pode remover conteúdo e banir contas.</p>
      </InfoSection>
    </InfoPage>
  )
}
