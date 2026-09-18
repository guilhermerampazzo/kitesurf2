'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { servicesApi } from '@/lib/api'
import toast from 'react-hot-toast'

const CATEGORY_OPTIONS = [
  { value: 'fotografia', label: 'Fotografia' },
  { value: 'video', label: 'Vídeo' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'design', label: 'Design' },
  { value: 'aula', label: 'Aula' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'outro', label: 'Outro' },
]

const PRICING_OPTIONS = [
  { value: 'fixed', label: 'Preço fixo' },
  { value: 'hourly', label: 'Por hora' },
  { value: 'daily', label: 'Por diária' },
]

const STATES_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map((s) => ({ value: s, label: s }))

export default function CriarServicoPage() {
  const router = useRouter()
  const { checking } = useRequireAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('fotografia')
  const [pricingType, setPricingType] = useState('fixed')
  const [price, setPrice] = useState('')
  const [minHours, setMinHours] = useState('1')
  const [maxHours, setMaxHours] = useState('8')
  const [city, setCity] = useState('')
  const [stateUF, setStateUF] = useState('CE')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (images.length + files.length > 6) { toast.error('Máximo 6 imagens.'); return }
    setImages((prev) => [...prev, ...files])
    files.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Informe o título.'); return }
    if (!description.trim()) { toast.error('Informe a descrição.'); return }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) { toast.error('Preço deve ser > 0.'); return }
    if (!city.trim()) { toast.error('Informe a cidade.'); return }
    if (pricingType === 'hourly' && (!minHours || !maxHours || parseInt(minHours) > parseInt(maxHours))) { toast.error('Min/max horas inválidos.'); return }

    setLoading(true)
    try {
      const uploaded: string[] = []
      for (const img of images) {
        const form = new FormData()
        form.append('file', img)
        const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
        const res = await fetch('/api/uploads/image', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!res.ok) throw new Error('Falha no upload de imagem.')
        const { url } = await res.json()
        uploaded.push(url)
      }

      await servicesApi.create({
        title: title.trim(),
        description: description.trim(),
        category,
        pricingType,
        price: parseFloat(price),
        minHours: pricingType === 'hourly' ? parseInt(minHours, 10) : undefined,
        maxHours: pricingType === 'hourly' ? parseInt(maxHours, 10) : undefined,
        city: city.trim(),
        state: stateUF,
        images: uploaded.length ? uploaded : undefined,
      })

      toast.success('Serviço criado com sucesso!')
      router.push('/servicos')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao criar serviço.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
              <Icon name="arrow_back" size={20} />
            </button>
            <div>
              <h1 className="text-headline-lg font-display font-black text-primary">Anunciar Serviço</h1>
              <p className="text-body-md text-secondary">Cadastre seu serviço para ser contratado na plataforma.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="card-soft p-6 md:p-8 flex flex-col gap-5">
              <h2 className="text-title-lg font-display font-extrabold text-on-surface flex items-center gap-2">
                <Icon name="handyman" size={20} className="text-primary" />
                Informações do serviço
              </h2>

              <Input label="Título" placeholder="Ex: Fotografia de kitesurf — ensaio na água" value={title} onChange={(e) => setTitle(e.target.value)} required />

              <Textarea label="Descrição" placeholder="Descreva o serviço, o que está incluso, diferenciais, portfólio..." value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />

              <div className="grid grid-cols-2 gap-4">
                <Select label="Categoria" options={CATEGORY_OPTIONS} value={category} onChange={(e) => setCategory(e.target.value)} />
                <Select label="Tipo de cobrança" options={PRICING_OPTIONS} value={pricingType} onChange={(e) => setPricingType(e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input label={`Preço (R$) ${pricingType === 'hourly' ? '/ hora' : pricingType === 'daily' ? '/ dia' : ''}`} type="number" min="0.01" step="0.01" placeholder="250" value={price} onChange={(e) => setPrice(e.target.value)} required />
                {pricingType === 'hourly' ? (
                  <>
                    <Input label="Mín. horas" type="number" min="1" step="1" value={minHours} onChange={(e) => setMinHours(e.target.value)} required />
                    <Input label="Máx. horas" type="number" min="1" step="1" value={maxHours} onChange={(e) => setMaxHours(e.target.value)} required />
                  </>
                ) : (
                  <>
                    <Input label="Cidade" placeholder="Ex: Cumbuco" value={city} onChange={(e) => setCity(e.target.value)} required />
                    <Select label="Estado" options={STATES_BR} value={stateUF} onChange={(e) => setStateUF(e.target.value)} />
                  </>
                )}
              </div>

              {pricingType === 'hourly' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Cidade" placeholder="Ex: Cumbuco" value={city} onChange={(e) => setCity(e.target.value)} required />
                  <Select label="Estado" options={STATES_BR} value={stateUF} onChange={(e) => setStateUF(e.target.value)} />
                </div>
              )}
            </div>

            <div className="card-soft p-6 md:p-8 flex flex-col gap-5">
              <h2 className="text-title-lg font-display font-extrabold text-on-surface">Imagens (opcional)</h2>
              <p className="text-body-md text-secondary">Até 6 imagens do seu trabalho/portfólio. A primeira será a capa.</p>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface-container-low group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute top-1 left-1 bg-primary text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded">Capa</span>}
                    <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Icon name="delete" size={20} className="text-white" />
                    </button>
                  </div>
                ))}
                {images.length < 6 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-fixed transition-colors">
                    <Icon name="add_photo_alternate" size={24} className="text-outline mb-1" />
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Adicionar</span>
                    <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">Cancelar</Button>
              <Button type="submit" loading={loading} className="flex-1">Publicar serviço</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
