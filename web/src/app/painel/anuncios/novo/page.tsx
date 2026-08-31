'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { listingsApi } from '@/lib/api'
import toast from 'react-hot-toast'

const CATEGORIES = ['Kitesurf', 'Wingfoil', 'Kitefoil', 'Kitewave', 'Acessórios'].map((c) => ({ value: c.toLowerCase(), label: c }))
const BRANDS = ['Duotone', 'Core', 'North', 'Cabrinha', 'F-One', 'Naish', 'Slingshot', 'Best', 'Flysurfer', 'Liquid Force', 'ION', 'Outro'].map((b) => ({ value: b.toLowerCase(), label: b }))
const STATES_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map((s) => ({ value: s, label: s }))

export default function NovoAnuncioPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('kitesurf')
  const [brand, setBrand] = useState('duotone')
  const [model, setModel] = useState('')
  const [condition, setCondition] = useState<'new' | 'used'>('used')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('CE')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (images.length + files.length > 10) { toast.error('Máximo 10 fotos.'); return }
    setImages((prev) => [...prev, ...files])
    files.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description || description === '<p></p>') { toast.error('Adicione uma descrição.'); return }
    if (images.length === 0) { toast.error('Adicione pelo menos 1 foto.'); return }

    setLoading(true)
    try {
      // Upload images first
      const uploadedUrls: string[] = []
      for (const img of images) {
        const form = new FormData()
        form.append('file', img)
        const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
        const res = await fetch('/api/uploads/image', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!res.ok) throw new Error('Falha no upload de imagem.')
        const { url } = await res.json()
        uploadedUrls.push(url)
      }

      await listingsApi.create({
        title, category, brand, model, condition,
        price: parseFloat(price), city, state,
        description, images: uploadedUrls,
      })

      toast.success('Anúncio criado com sucesso!')
      router.push('/painel/anuncios')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao criar anúncio.')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 p-unit-xl overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-unit-xl">
            <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
              <Icon name="arrow_back" size={20} />
            </button>
            <h1 className="text-headline-lg font-display font-black text-primary">Criar Anúncio</h1>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-unit-xl">
            {/* Basic info */}
            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Informações básicas</h2>

              <Input
                label="Título do anúncio"
                placeholder="Ex: Kite Duotone Rebel SLS 10m 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-unit-md">
                <Select label="Categoria" options={CATEGORIES} value={category} onChange={(e) => setCategory(e.target.value)} />
                <Select label="Marca" options={BRANDS} value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>

              <Input label="Modelo" placeholder="Ex: Rebel SLS 10m" value={model} onChange={(e) => setModel(e.target.value)} />

              <div className="flex flex-col gap-unit-xs">
                <label className="text-label-md text-on-surface uppercase tracking-wider">Condição</label>
                <div className="flex gap-unit-md">
                  {(['used', 'new'] as const).map((c) => (
                    <label key={c} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        checked={condition === c}
                        onChange={() => setCondition(c)}
                        className="w-4 h-4 text-primary border-outline-variant"
                      />
                      <span className="text-body-md">{c === 'new' ? 'Novo' : 'Usado'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Preço (R$)"
                type="number"
                placeholder="0,00"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            {/* Location */}
            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Localização</h2>
              <div className="grid grid-cols-2 gap-unit-md">
                <Input label="Cidade" placeholder="Ex: Fortaleza" value={city} onChange={(e) => setCity(e.target.value)} required />
                <Select label="Estado" options={STATES_BR} value={state} onChange={(e) => setState(e.target.value)} />
              </div>
            </div>

            {/* Photos */}
            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Fotos</h2>
              <p className="text-body-md text-secondary">Adicione até 10 fotos. A primeira será a capa do anúncio.</p>

              <div className="grid grid-cols-5 gap-unit-sm">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-low group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-primary text-on-primary text-[9px] font-bold px-1 py-0.5 rounded">Capa</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Icon name="delete" size={20} className="text-white" />
                    </button>
                  </div>
                ))}

                {images.length < 10 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-fixed transition-colors">
                    <Icon name="add_photo_alternate" size={28} className="text-outline mb-1" />
                    <span className="text-[10px] text-secondary">Adicionar</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Description with TipTap */}
            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Descrição</h2>
              <p className="text-body-md text-secondary">
                Descreva detalhadamente o equipamento. Não inclua informações de contato — use o chat da plataforma.
              </p>
              <TiptapEditor value={description} onChange={setDescription} />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Publicar anúncio
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
