'use client'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Icon } from '@/components/ui/Icon'
import { chatApi, authApi } from '@/lib/api'
import { formatRelative } from '@/lib/utils'
import type { Conversation, Message, User } from '@/types'
import toast from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'

const CONTACT_BLOCKED_MSG = 'Mensagem não enviada. Por segurança, não compartilhe contatos fora da plataforma.'

function ChatContent() {
  const params = useSearchParams()
  const initialConvId = params.get('conv')
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(initialConvId)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    authApi.me().then((r) => setUser(r.data)).catch(() => {})
    chatApi.conversations().then((r) => setConversations(r.data ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeConv) return
    chatApi.messages(activeConv)
      .then((r) => setMessages(r.data ?? []))
      .catch(() => toast.error('Erro ao carregar mensagens.'))
  }, [activeConv])

  useEffect(() => {
    if (!activeConv) return
    const token = localStorage.getItem('kite_access_token')
    socketRef.current = io('/chat', { path: '/socket.io', auth: { token } })
    socketRef.current.emit('join', activeConv)
    socketRef.current.on('message', (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })
    return () => { socketRef.current?.disconnect() }
  }, [activeConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !activeConv) return
    setSending(true)
    try {
      const res = await chatApi.send(activeConv, { content: input.trim() })
      if (res.data.isBlocked) {
        toast.error(CONTACT_BLOCKED_MSG, { duration: 5000 })
      } else {
        setMessages((prev) => [...prev, res.data])
        setInput('')
      }
    } catch { toast.error('Erro ao enviar mensagem.') }
    finally { setSending(false) }
  }

  const activeConvData = conversations.find((c) => c.id === activeConv)
  // On mobile: show list if no active conv, show chat if active conv selected
  const showList = !activeConv || !activeConvData
  const showChat = activeConv && activeConvData

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar userName={user?.name} userAvatar={user?.avatar} />

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations list — hidden on mobile when chat is open */}
        <div className={`${showChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r border-outline-variant bg-surface-container-lowest flex-col`}>
          <div className="p-unit-lg border-b border-outline-variant">
            <h1 className="text-title-lg font-display font-black text-primary">Mensagens</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4 py-unit-xl">
                <Icon name="chat" size={48} className="text-outline-variant" />
                <p className="text-body-md text-secondary">Nenhuma conversa ainda.</p>
              </div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConv(c.id)}
                className={`w-full flex items-center gap-3 px-unit-lg py-unit-md text-left border-b border-outline-variant transition-colors hover:bg-surface-container ${
                  activeConv === c.id ? 'bg-primary-fixed border-l-2 border-l-primary' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-display font-bold shrink-0">
                  {c.otherUser.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-body-md font-bold text-on-surface truncate">{c.otherUser.name}</span>
                    {c.lastMessage && (
                      <span className="text-label-md text-secondary shrink-0">{formatRelative(c.lastMessage.createdAt)}</span>
                    )}
                  </div>
                  <div className="text-body-md text-secondary truncate">{c.listing.title}</div>
                  {c.lastMessage && (
                    <div className="text-body-md text-outline truncate text-[12px]">{c.lastMessage.content}</div>
                  )}
                </div>
                {c.unreadCount > 0 && (
                  <span className="btn-accent text-accent-ink text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        {showChat ? (
          <div className="flex-1 flex flex-col">
            {/* Chat header with back button on mobile */}
            <div className="px-unit-lg py-unit-md border-b border-outline-variant bg-surface-container-lowest flex items-center gap-3">
              <button
                onClick={() => setActiveConv(null)}
                className="md:hidden p-1 rounded-lg hover:bg-surface-container mr-1"
              >
                <Icon name="arrow_back" size={22} className="text-on-surface" />
              </button>
              <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-display font-bold shrink-0">
                {activeConvData.otherUser.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-body-md font-bold text-on-surface">{activeConvData.otherUser.name}</div>
                <div className="text-label-md text-secondary truncate">{activeConvData.listing.title}</div>
              </div>
            </div>

            {/* Security notice */}
            <div className="px-unit-lg py-2 bg-primary-fixed border-b border-outline-variant flex items-center gap-2 text-label-md text-secondary">
              <Icon name="security" size={14} className="text-primary shrink-0" />
              Por segurança, não compartilhe contatos externos.
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-unit-lg py-unit-md flex flex-col gap-3">
              {messages.map((m) => {
                const isMe = m.senderId === user?.id
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] px-unit-md py-2 rounded-xl text-body-md ${
                        m.isBlocked
                          ? 'bg-error-container text-on-error-container italic text-label-md'
                          : isMe
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      {m.isBlocked ? '🔒 Mensagem bloqueada (tentativa de contato externo)' : m.content}
                      <div className={`text-[10px] mt-1 ${isMe ? 'text-on-primary opacity-60' : 'text-secondary'}`}>
                        {formatRelative(m.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="px-unit-lg py-unit-md border-t border-outline-variant bg-surface-container-lowest flex items-center gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escreva uma mensagem..."
                className="flex-1 bg-surface-container-low border border-outline-variant rounded-full px-unit-lg py-2 text-body-md focus:outline-none focus:border-primary"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 transition-opacity"
              >
                <Icon name="send" size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <Icon name="chat" size={64} className="text-outline-variant" />
            <h2 className="text-title-lg font-bold text-on-surface">Selecione uma conversa</h2>
            <p className="text-body-md text-secondary">Escolha uma conversa à esquerda para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MensagensPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  )
}
