'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { eventsApi, authApi } from '@/lib/api'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'kitesurf', label: 'Kitesurf' },
  { value: 'musica', label: 'Música' },
  { value: 'gastronomia', label: 'Gastronomia' },
  { value: 'esporte', label: 'Esporte' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'competicao', label: 'Competição' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'outro', label: 'Outro' },
]

const STATES_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map((s) => ({ value: s, label: s }))

type EventCreated = { id: string; title: string; type: string }

export default function CriarEventoPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<EventCreated | null>(null)

  // quick ticket form after creation
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState({ name: '', description: '', price: '', quantity: '', maxPerUser: '5', salesStart: '', salesEnd: '' })
  const [ticketLoading, setTicketLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    coverImage: '',
    images: '' as string, // comma separated or upload
    category: 'kitesurf',
    type: 'comum' as 'comum' | 'destaque' | 'oficial',
    city: '',
    state: 'CE',
    address: '',
    venue: '',
    lat: '',
    lng: '',
    startDate: '',
    endDate: '',
    startTime: '',
    maxAttendees: '',
    instagram: '',
    facebook: '',
    whatsapp: '',
    site: '',
  })

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)

  useEffect(() => {
    authApi.me().then((r) => setIsAdmin(!!r.data.isAdmin)).catch(() => {})
  }, [])

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
    const res = await fetch('/api/uploads/image', { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!res.ok) throw new Error('Falha no upload')
    const { url } = await res.json()
    return url as string
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Título obrigatório.'); return }
    if (!form.description || form.description === '<p></p>') { toast.error('Descrição obrigatória.'); return }
    if (!form.city.trim() || !form.state.trim()) { toast.error('Cidade e estado obrigatórios.'); return }
    if (!form.startDate) { toast.error('Data de início obrigatória.'); return }
    if (form.type === 'oficial' && !isAdmin) { toast.error('Apenas administradores podem criar eventos oficiais.'); return }

    setLoading(true)
    try {
      let coverImage = form.coverImage.trim() || undefined
      if (coverFile) coverImage = await uploadImage(coverFile)

      let images: string[] = []
      if (form.images.trim()) {
        images = form.images.split(',').map(s => s.trim()).filter(Boolean)
      }
      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const url = await uploadImage(imageFiles[i])
          images.push(url)
        }
      }

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description,
        category: form.category,
        type: form.type,
        city: form.city.trim(),
        state: form.state,
        startDate: new Date(form.startDate).toISOString(),
      }
      if (coverImage) payload.coverImage = coverImage
      if (images.length) payload.images = images
      if (form.address.trim()) payload.address = form.address.trim()
      if (form.venue.trim()) payload.venue = form.venue.trim()
      if (form.lat) payload.lat = parseFloat(form.lat)
      if (form.lng) payload.lng = parseFloat(form.lng)
      if (form.endDate) payload.endDate = new Date(form.endDate).toISOString()
      if (form.startTime) payload.startTime = form.startTime
      if (form.maxAttendees) payload.maxAttendees = parseInt(form.maxAttendees, 10)
      const socialLinks: Record<string,string> = {}
      if (form.instagram.trim()) socialLinks.instagram = form.instagram.trim()
      if (form.facebook.trim()) socialLinks.facebook = form.facebook.trim()
      if (form.whatsapp.trim()) socialLinks.whatsapp = form.whatsapp.trim()
      if (form.site.trim()) socialLinks.site = form.site.trim()
      if (Object.keys(socialLinks).length) payload.socialLinks = socialLinks

      const { data } = await eventsApi.create(payload)
      const ev = (data.event ?? data) as EventCreated
      setCreated({ id: ev.id, title: ev.title ?? form.title, type: ev.type ?? form.type })
      toast.success('Evento criado com sucesso!')
      if (form.type === 'destaque') {
        toast('Evento destaque requer pagamento de R$ 99,90 para ativar.', { icon: '⭐' })
      }
      setShowTicketForm(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao criar evento.'))
    } finally { setLoading(false) }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!created) return
    if (!ticketForm.name.trim()) { toast.error('Nome do ingresso obrigatório.'); return }
    if (!ticketForm.quantity) { toast.error('Quantidade obrigatória.'); return }
    setTicketLoading(true)
    try {
      await eventsApi.createTicketType(created.id, {
        name: ticketForm.name.trim(),
        description: ticketForm.description.trim() || undefined,
        price: parseFloat(ticketForm.price || '0'),
        quantity: parseInt(ticketForm.quantity, 10),
        maxPerUser: parseInt(ticketForm.maxPerUser || '5', 10),
        salesStart: ticketForm.salesStart ? new Date(ticketForm.salesStart).toISOString() : undefined,
        salesEnd: ticketForm.salesEnd ? new Date(ticketForm.salesEnd).toISOString() : undefined,
      })
      toast.success('Ingresso criado!')
      setTicketForm({ name: '', description: '', price: '', quantity: '', maxPerUser: '5', salesStart: '', salesEnd: '' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao criar ingresso.')
    } finally { setTicketLoading(false) }
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-3xl mx-auto px-margin-desktop pb-16">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
            <Icon name="arrow_back" size={20} />
          </button>
          <h1 className="text-headline-lg font-display font-black text-primary">Criar Evento</h1>
          <span className="ml-auto hidden md:inline-flex items-center gap-1 text-label-md bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full font-bold"><Icon name="event" size={14}/> Sympla-like</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Básico */}
          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Informações básicas</h2>
            <Input label="Título do evento *" placeholder="Ex: Kite Festival Cumbuco 2026" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Categoria *" options={CATEGORIES} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <div className="flex flex-col gap-unit-xs">
                <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Tipo *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as never })} className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer">
                  <option value="comum">Comum</option>
                  <option value="destaque">Destaque — R$ 99,90 único</option>
                  <option value="oficial" disabled={!isAdmin}>Oficial — apenas admin { !isAdmin ? '(desabilitado)' : ''}</option>
                </select>
                {form.type === 'destaque' && <span className="text-label-md text-amber-700 font-semibold">Destaque custa R$ 99,90 pagamento único e fica ativo por 30 dias.</span>}
                {form.type === 'oficial' && !isAdmin && <span className="text-label-md text-error">Apenas administradores podem criar eventos oficiais.</span>}
              </div>
            </div>
            <div className="flex flex-col gap-unit-xs">
              <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Descrição *</label>
              <TiptapEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Descreva o evento com detalhes, programação, atrações..." />
            </div>
          </div>

          {/* Mídia */}
          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Mídia</h2>
            <Input label="Cover image (URL)" placeholder="https://... ou faça upload abaixo" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} icon="image" />
            <div className="flex flex-col gap-unit-xs">
              <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Upload capa</label>
              <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} className="text-body-md" />
            </div>
            <Input label="Galeria (URLs separadas por vírgula)" placeholder="https://... , https://..." value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} icon="collections" />
            <div className="flex flex-col gap-unit-xs">
              <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Upload galeria (múltiplas)</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(e.target.files)} className="text-body-md" />
            </div>
          </div>

          {/* Local */}
          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Localização</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Cidade *" placeholder="Fortaleza" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required icon="location_city" />
              <Select label="Estado *" options={STATES_BR} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <Input label="Endereço" placeholder="Rua, número, bairro" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} icon="home" />
            <Input label="Local / Venue" placeholder="Ex: Praia do Cumbuco, Arena Kite" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} icon="place" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Latitude" type="number" step="any" placeholder="-3.72" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
              <Input label="Longitude" type="number" step="any" placeholder="-38.54" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
            </div>
            <p className="text-label-md text-secondary">Se preencher lat/lng, o mapa será exibido na página do evento.</p>
          </div>

          {/* Data */}
          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Data & lotação</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Data início *" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              <Input label="Data fim" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              <Input label="Horário (HH:mm)" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <Input label="Máx. participantes" type="number" min="1" placeholder="Ex: 500" value={form.maxAttendees} onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })} icon="groups" />
          </div>

          {/* Social */}
          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Redes & contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Instagram" placeholder="https://instagram.com/..." value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} icon="photo_camera" />
              <Input label="Facebook" placeholder="https://facebook.com/..." value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} icon="public" />
              <Input label="WhatsApp" placeholder="https://wa.me/..." value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} icon="chat" />
              <Input label="Site" placeholder="https://..." value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} icon="language" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={loading} className="flex-1" variant="accent">
              <Icon name="event" size={18}/> Criar evento
            </Button>
          </div>
        </form>

        {/* Post-creation ticket helper */}
        {created && (
          <div className="mt-8 card-soft p-6 border-green-200 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-300 font-display font-extrabold mb-2">
              <Icon name="check_circle" size={20} className="text-green-600"/> Evento criado: {created.title}
            </div>
            <p className="text-body-md text-secondary mb-4">ID: <code className="bg-surface-container px-1 py-0.5 rounded">{created.id}</code> · Tipo: {created.type} · Agora adicione ingressos.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Link href={`/eventos/${created.id}`}><Button variant="ghost" size="sm"><Icon name="visibility" size={16}/> Ver evento</Button></Link>
              <Link href={`/eventos/${created.id}/ingressos`}><Button size="sm"><Icon name="confirmation_number" size={16}/> Gerenciar ingressos</Button></Link>
              {created.type === 'destaque' && (
                <Link href={`/eventos/${created.id}`}><Button variant="accent" size="sm"><Icon name="star" size={16}/> Pagar destaque R$ 99,90</Button></Link>
              )}
            </div>

            {/* Inline quick ticket creation */}
            <div className="border-t border-green-200 pt-4">
              <h3 className="font-display font-extrabold text-on-surface mb-3 flex items-center gap-2"><Icon name="local_activity" size={18}/> Adicionar ingresso rápido</h3>
              <form onSubmit={handleCreateTicket} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2"><Input label="Nome *" placeholder="Ex: Lote 1 - Inteira" value={ticketForm.name} onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })} required /></div>
                <div className="md:col-span-2"><Textarea label="Descrição" placeholder="Benefícios deste ingresso" value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} rows={2} /></div>
                <Input label="Preço (R$)" type="number" step="0.01" min="0" placeholder="0 para gratuito" value={ticketForm.price} onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })} />
                <Input label="Quantidade *" type="number" min="1" placeholder="100" value={ticketForm.quantity} onChange={(e) => setTicketForm({ ...ticketForm, quantity: e.target.value })} required />
                <Input label="Máx por pessoa" type="number" min="1" placeholder="5" value={ticketForm.maxPerUser} onChange={(e) => setTicketForm({ ...ticketForm, maxPerUser: e.target.value })} />
                <Input label="Início vendas" type="datetime-local" value={ticketForm.salesStart} onChange={(e) => setTicketForm({ ...ticketForm, salesStart: e.target.value })} />
                <Input label="Fim vendas" type="datetime-local" value={ticketForm.salesEnd} onChange={(e) => setTicketForm({ ...ticketForm, salesEnd: e.target.value })} />
                <div className="md:col-span-2">
                  <Button type="submit" loading={ticketLoading} variant="accent" className="w-full"><Icon name="add" size={18}/> Criar ingresso</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
