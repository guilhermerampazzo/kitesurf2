'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { eventsApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type TicketType = {
  id: string
  name: string
  description?: string | null
  price: number
  quantity: number
  sold: number
  remaining?: number
  maxPerUser: number
  salesStart?: string | null
  salesEnd?: string | null
  requiresInfo?: string[] | null
  status: string
}

type EventBrief = { id: string; title: string; organizerId: string }

export default function GerenciarIngressosPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [event, setEvent] = useState<EventBrief | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TicketType | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    maxPerUser: '5',
    salesStart: '',
    salesEnd: '',
    requiresInfo: '',
    status: 'active' as string,
  })
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [evRes, ttRes] = await Promise.all([
        eventsApi.get(eventId),
        eventsApi.listTicketTypes(eventId),
      ])
      setEvent({ id: evRes.data.id, title: evRes.data.title, organizerId: evRes.data.organizerId })
      const tts = Array.isArray(ttRes.data) ? ttRes.data : ttRes.data.data ?? ttRes.data
      setTicketTypes((tts as TicketType[]) ?? [])
    } catch {
      toast.error('Erro ao carregar ingressos.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [eventId])

  function resetForm() {
    setForm({ name: '', description: '', price: '', quantity: '', maxPerUser: '5', salesStart: '', salesEnd: '', requiresInfo: '', status: 'active' })
    setEditing(null)
  }

  function startEdit(tt: TicketType) {
    setEditing(tt)
    setForm({
      name: tt.name,
      description: tt.description ?? '',
      price: String(tt.price),
      quantity: String(tt.quantity),
      maxPerUser: String(tt.maxPerUser),
      salesStart: tt.salesStart ? new Date(tt.salesStart).toISOString().slice(0,16) : '',
      salesEnd: tt.salesEnd ? new Date(tt.salesEnd).toISOString().slice(0,16) : '',
      requiresInfo: (tt.requiresInfo ?? []).join(', '),
      status: tt.status,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Nome obrigatório.'); return }
    if (!form.quantity) { toast.error('Quantidade obrigatória.'); return }
    setSubmitting(true)
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: parseFloat(form.price || '0'),
      quantity: parseInt(form.quantity, 10),
      maxPerUser: parseInt(form.maxPerUser || '5', 10),
      status: form.status,
    }
    if (form.salesStart) payload.salesStart = new Date(form.salesStart).toISOString()
    if (form.salesEnd) payload.salesEnd = new Date(form.salesEnd).toISOString()
    if (form.requiresInfo.trim()) payload.requiresInfo = form.requiresInfo.split(',').map(s => s.trim()).filter(Boolean)
    else if (editing) payload.requiresInfo = []

    try {
      if (editing) {
        await eventsApi.updateTicketType(eventId, editing.id, payload)
        toast.success('Ingresso atualizado!')
      } else {
        await eventsApi.createTicketType(eventId, payload)
        toast.success('Ingresso criado!')
      }
      resetForm()
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao salvar ingresso.'))
    } finally { setSubmitting(false) }
  }

  async function handleDelete(tt: TicketType) {
    if (!confirm(`Excluir "${tt.name}"?`)) return
    if (tt.sold > 0) { toast.error('Não é possível excluir ingresso com vendas.'); return }
    try {
      await eventsApi.deleteTicketType(eventId, tt.id)
      toast.success('Ingresso excluído.')
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao excluir.')
    }
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-5xl mx-auto px-margin-desktop pb-16">
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-4">
          <Link href="/eventos" className="hover:text-primary">Eventos</Link>
          <Icon name="chevron_right" size={16}/>
          <Link href={`/eventos/${eventId}`} className="hover:text-primary truncate max-w-xs">{event?.title ?? 'Evento'}</Link>
          <Icon name="chevron_right" size={16}/>
          <span className="text-on-surface font-bold">Ingressos</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-headline-lg font-display font-black text-primary flex items-center gap-2">
              <Icon name="confirmation_number" size={28} /> Gerenciar ingressos
            </h1>
            <p className="text-body-md text-secondary">{event?.title ?? 'Carregando...'}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/eventos/${eventId}`}><Button variant="ghost" size="sm"><Icon name="visibility" size={16}/> Ver evento</Button></Link>
            <Link href={`/eventos/${eventId}/checkin`}><Button variant="ghost" size="sm"><Icon name="qr_code_scanner" size={16}/> Check-in</Button></Link>
          </div>
        </div>

        {/* Form */}
        <div className="card-soft p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">
              {editing ? `Editar: ${editing.name}` : 'Novo tipo de ingresso'}
            </h2>
            {editing && <Button variant="ghost" size="sm" onClick={resetForm}><Icon name="close" size={16}/> Cancelar edição</Button>}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Nome *" placeholder="Ex: Inteira, Meia, VIP, Lote 1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Descrição" placeholder="Benefícios, inclusões, observações" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <Input label="Preço (R$) — 0 = grátis" type="number" step="0.01" min="0" placeholder="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} icon="payments" />
            <Input label="Quantidade *" type="number" min="1" placeholder="100" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required icon="inventory_2" />
            <Input label="Máx por pessoa" type="number" min="1" placeholder="5" value={form.maxPerUser} onChange={(e) => setForm({ ...form, maxPerUser: e.target.value })} icon="group" />
            <Select label="Status" options={[{ value: 'active', label: 'Ativo' }, { value: 'paused', label: 'Pausado' }, { value: 'sold_out', label: 'Esgotado' }]} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            <Input label="Início vendas" type="datetime-local" value={form.salesStart} onChange={(e) => setForm({ ...form, salesStart: e.target.value })} />
            <Input label="Fim vendas" type="datetime-local" value={form.salesEnd} onChange={(e) => setForm({ ...form, salesEnd: e.target.value })} />
            <div className="md:col-span-2">
              <Input label="Campos extras (requiresInfo) — separado por vírgula" placeholder="Ex: cpf, nascimento, camisa — deixe vazio se não precisa" value={form.requiresInfo} onChange={(e) => setForm({ ...form, requiresInfo: e.target.value })} icon="badge" />
              <p className="text-label-md text-secondary mt-1">Se preenchido, o comprador deverá informar esses dados por ingresso na hora da compra.</p>
            </div>
            <div className="md:col-span-2 flex gap-3 mt-2">
              <Button type="submit" loading={submitting} variant="accent" className="flex-1">
                <Icon name={editing ? 'save' : 'add'} size={18}/> {editing ? 'Salvar alterações' : 'Criar ingresso'}
              </Button>
              {editing && <Button type="button" variant="ghost" onClick={resetForm} className="flex-1">Cancelar</Button>}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="card-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Ingressos cadastrados ({ticketTypes.length})</h2>
            <Button variant="ghost" size="sm" onClick={load}><Icon name="refresh" size={16}/> Atualizar</Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
          ) : ticketTypes.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="confirmation_number" size={48} className="text-outline-variant mx-auto mb-3"/>
              <p className="text-body-md text-secondary">Nenhum ingresso cadastrado.</p>
              <p className="text-body-md text-secondary">Crie o primeiro tipo acima.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {ticketTypes.map((tt) => (
                <div key={tt.id} className="border border-outline-variant rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-soft transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-title-lg font-display font-extrabold text-on-surface">{tt.name}</span>
                      <Badge variant={tt.status === 'active' ? 'success' : tt.status === 'sold_out' ? 'error' : 'pending'} className="capitalize">{tt.status === 'active' ? 'Ativo' : tt.status === 'sold_out' ? 'Esgotado' : 'Pausado'}</Badge>
                      {tt.price === 0 ? <span className="text-label-md bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Grátis</span> : <span className="text-price-display font-black text-primary">{formatPrice(tt.price)}</span>}
                    </div>
                    {tt.description && <p className="text-body-md text-secondary mt-1">{tt.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-body-md text-secondary">
                      <span className="inline-flex items-center gap-1"><Icon name="inventory_2" size={14}/> {tt.quantity} total</span>
                      <span className="inline-flex items-center gap-1"><Icon name="shopping_cart" size={14}/> {tt.sold} vendidos</span>
                      <span className="inline-flex items-center gap-1 font-bold text-primary"><Icon name="confirmation_number" size={14}/> {tt.remaining ?? tt.quantity - tt.sold} restantes</span>
                      <span className="inline-flex items-center gap-1"><Icon name="group" size={14}/> máx {tt.maxPerUser}/pessoa</span>
                    </div>
                    {(tt.salesStart || tt.salesEnd) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tt.salesStart && <span className="text-[11px] px-2 py-0.5 bg-surface-container rounded-full">Início: {new Date(tt.salesStart).toLocaleString('pt-BR')}</span>}
                        {tt.salesEnd && <span className="text-[11px] px-2 py-0.5 bg-surface-container rounded-full">Fim: {new Date(tt.salesEnd).toLocaleString('pt-BR')}</span>}
                      </div>
                    )}
                    {tt.requiresInfo && tt.requiresInfo.length > 0 && (
                      <div className="mt-2 text-label-md text-amber-800 bg-amber-50 inline-flex items-center gap-1 px-2 py-1 rounded-full"><Icon name="badge" size={12}/> requer: {tt.requiresInfo.join(', ')}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(tt)}><Icon name="edit" size={16}/> Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(tt)} className="!text-error hover:!bg-error-container"><Icon name="delete" size={16}/></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
