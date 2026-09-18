import { InfoPage, InfoSection } from '@/components/layout/InfoPage'

export const metadata = { title: 'Ajuda — KITE360º' }

export default function AjudaPage() {
  return (
    <InfoPage icon="support_agent" title={<span className="accent-word">Ajuda</span>} subtitle="Perguntas frequentes e como usar a plataforma.">
      <InfoSection title="Como compro?">
        <p>Busque o equipamento, abra o anúncio e clique em <strong>Entrar em contato</strong> para falar com o vendedor pelo chat interno. Combine os detalhes e conclua com segurança.</p>
      </InfoSection>
      <InfoSection title="Como vendo?">
        <p>Clique em <strong>Anunciar</strong>, preencha título, categoria, preço, fotos e descrição. Seu anúncio entra no ar e você recebe as mensagens no painel.</p>
      </InfoSection>
      <InfoSection title="Por que não consigo enviar meu telefone no chat?">
        <p>Por segurança, o chat bloqueia telefones, e-mails, links e redes sociais. Isso protege compradores e vendedores contra golpes. Mantenha a conversa na plataforma.</p>
      </InfoSection>
      <InfoSection title="O que é o selo verificado?">
        <p>É a confirmação de identidade e reputação do usuário. Contas verificadas transmitem mais confiança e vendem mais rápido. Veja como obter em <strong>Conta → Verificação</strong>.</p>
      </InfoSection>
      <InfoSection title="Esqueci minha senha">
        <p>Na tela de login, clique em <strong>Esqueci minha senha</strong> e siga as instruções enviadas ao seu e-mail.</p>
      </InfoSection>
    </InfoPage>
  )
}
