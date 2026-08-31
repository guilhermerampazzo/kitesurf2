'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

export default function EditarEventoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    coverImage: '',
    images: '',
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
    if (!localStorage.getItem('kite_access_token')) {
      toast.error('Faça login para editar.')
      router.push('/login')
      return
    }
    authApi.me().then((r) => setIsAdmin(!!r.data.isAdmin)).catch(() => {})
    eventsApi.get(id).then((r) => {
      const e = r.data
      setForm({
        title: e.title ?? '',
        description: e.description ?? '',
        coverImage: e.coverImage ?? '',
        images: Array.isArray(e.images) ? (e.images as string[]).join(', ') : '',
        category: e.category ?? 'kitesurf',
        type: (e.type ?? 'comum') as never,
        city: e.city ?? '',
        state: e.state ?? 'CE',
        address: e.address ?? '',
        venue: e.venue ?? '',
        lat: e.lat != null ? String(e.lat) : '',
        lng: e.lng != null ? String(e.lng) : '',
        startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0,16) : '',
        endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0,16) : '',
        startTime: e.startTime ?? '',
        maxAttendees: e.maxAttendees != null ? String(e.maxAttendees) : '',
        instagram: e.socialLinks?.instagram ?? '',
        facebook: e.socialLinks?.facebook ?? '',
        whatsapp: e.socialLinks?.whatsapp ?? '',
        site: e.socialLinks?.site ?? '',
      })
    }).catch(() => {
      toast.error('Evento não encontrado.')
      router.push('/eventos')
    }).finally(() => setLoading(false))
  }, [id, router])

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
    const res = await fetch('/api/uploads/image', { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!res.ok) throw new Error('Upload falhou')
    const { url } = await res.json()
    return url as string
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Título obrigatório.'); return }
    if (form.type === 'oficial' && !isAdmin) { toast.error('Apenas admin pode definir como oficial.'); return }
    setSubmitting(true)
    try {
      let coverImage = form.coverImage.trim() || undefined
      if (coverFile) coverImage = await uploadImage(coverFile)
      let images: string[] | undefined
      if (form.images.trim()) images = form.images.split(',').map(s => s.trim()).filter(Boolean)
      if (imageFiles && imageFiles.length > 0) {
        const uploaded: string[] = []
        for (let i = 0; i < imageFiles.length; i++) uploaded.push(await uploadImage(imageFiles[i]))
        images = [...(images ?? []), ...uploaded]
      }
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description,
        category: form.category,
        type: form.type,
        city: form.city.trim(),
        state: form.state,
        coverImage,
        images,
        address: form.address.trim() || undefined,
        venue: form.venue.trim() || undefined,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        startTime: form.startTime || undefined,
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees, 10) : undefined,
      }
      const socialLinks: Record<string,string> = {}
      if (form.instagram.trim()) socialLinks.instagram = form.instagram.trim()
      if (form.facebook.trim()) socialLinks.facebook = form.facebook.trim()
      if (form.whatsapp.trim()) socialLinks.whatsapp = form.whatsapp.trim()
      if (form.site.trim()) socialLinks.site = form.site.trim()
      if (Object.keys(socialLinks).length) payload.socialLinks = socialLinks
      // remove undefined to avoid clearing? API handles undefined as no update
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

      await eventsApi.update(id, payload)
      toast.success('Evento atualizado!')
      router.push(`/eventos/${id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao atualizar.'))
    } finally { setSubmitting(false) }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-3xl mx-auto px-margin-desktop py-16 pt-2 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-3xl mx-auto px-margin-desktop pb-16 pt-2">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg">
            <Icon name="arrow_back" size={20}/>
          </button>
          <h1 className="text-headline-lg font-display font-black text-primary">Editar evento</h1>
          <Link href={`/eventos/${id}`} className="ml-auto"><Button variant="ghost" size="sm"><Icon name="visibility" size={16}/> Ver evento</Button></Link>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Informações básicas</h2>
            <Input label="Título *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Categoria *" options={CATEGORIES} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <div className="flex flex-col gap-unit-xs">
                <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Tipo *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as never })} className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer">
                  <option value="comum">Comum</option>
                  <option value="destaque">Destaque — R$ 99,90 único</option>
                  <option value="oficial" disabled={!isAdmin}>Oficial { !isAdmin ? '(apenas admin)' : ''}</option>
                </select>
                {!isAdmin && form.type === 'oficial' && <span className="text-label-md text-error">Você não tem permissão para tipo oficial.</span>}
              </div>
            </div>
            <div className="flex flex-col gap-unit-xs">
              <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Descrição *</label>
              <TiptapEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            </div>
          </div>

          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Mídia</h2>
            <Input label="Cover image (URL)" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} icon="image" />
            <div className="flex flex-col gap-unit-xs">
              <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Trocar capa (upload)</label>
              <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} className="text-body-md" />
            </div>
            <Input label="Galeria (URLs vírgula)" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} icon="collections" />
            <div className="flex flex-col gap-unit-xs">
              <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Adicionar galeria (upload múltiplo)</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(e.target.files)} className="text-body-md" />
            </div>
          </div>

          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Localização</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Cidade *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required icon="location_city" />
              <Select label="Estado *" options={STATES_BR} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <Input label="Endereço" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} icon="home" />
            <Input label="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} icon="place" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Latitude" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
              <Input label="Longitude" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
            </div>
          </div>

          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Data & lotação</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Início *" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              <Input label="Fim" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              <Input label="Horário HH:mm" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <Input label="Máx participantes" type="number" min="1" value={form.maxAttendees} onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })} icon="groups" />
          </div>

          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Redes & contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} icon="photo_camera" />
              <Input label="Facebook" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} icon="public" />
              <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} icon="chat" />
              <Input label="Site" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} icon="language" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={submitting} variant="accent" className="flex-1"><Icon name="save" size={18}/> Salvar alterações</Button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  )
}
