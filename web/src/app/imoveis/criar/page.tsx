'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { propertiesApi } from '@/lib/api'
import toast from 'react-hot-toast'

const TYPE_OPTIONS = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'flat', label: 'Flat' },
  { value: 'kitnet', label: 'Kitnet' },
  { value: 'comercial', label: 'Comercial' },
]

const PURPOSE_OPTIONS = [
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' },
]

const STATES_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map((s) => ({ value: s, label: s }))

export default function CriarImovelPage() {
  const router = useRouter()
  useEffect(() => {
    if (!localStorage.getItem('kite_access_token')) {
      toast.error('Faça login para anunciar.')
      router.push('/login')
    }
  }, [router])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('casa')
  const [purpose, setPurpose] = useState('venda')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('2')
  const [bathrooms, setBathrooms] = useState('1')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setStateVal] = useState('CE')
  const [featuresInput, setFeaturesInput] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (images.length + files.length > 10) { toast.error('Máximo 10 imagens.'); return }
    setImages((prev) => [...prev, ...files])
    files.forEach((f) => {
      const r = new FileReader()
      r.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string])
      r.readAsDataURL(f)
    })
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description || description === '<p></p>') { toast.error('Adicione uma descrição.'); return }
    setLoading(true)
    try {
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

      const features = featuresInput.split(',').map((s) => s.trim()).filter(Boolean)

      await propertiesApi.create({
        title, description, type, purpose,
        price: parseFloat(price),
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseInt(bathrooms, 10),
        area: area ? parseFloat(area) : undefined,
        address, city, state,
        features,
        images: uploadedUrls,
      })

      toast.success('Imóvel publicado com sucesso!')
      router.push('/imoveis')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao criar imóvel.')
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-headline-lg font-display font-black text-primary">Anunciar Imóvel</h1>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="card-soft p-6 flex flex-col gap-4">
              <h2 className="text-title-lg font-bold text-on-surface">Informações básicas</h2>

              <Input label="Título" placeholder="Ex: Casa 3 suítes — Frente mar, Cumbuco" value={title} onChange={(e) => setTitle(e.target.value)} required />

              <div className="grid grid-cols-2 gap-4">
                <Select label="Tipo" options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} />
                <Select label="Finalidade" options={PURPOSE_OPTIONS} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              </div>

              <Input label="Preço (R$)" type="number" min="0" step="0.01" placeholder="850000" value={price} onChange={(e) => setPrice(e.target.value)} required />

              <div className="grid grid-cols-3 gap-4">
                <Input label="Quartos" type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                <Input label="Banheiros" type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
                <Input label="Área (m²)" type="number" min="0" step="0.01" placeholder="120" value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
            </div>

            <div className="card-soft p-6 flex flex-col gap-4">
              <h2 className="text-title-lg font-bold text-on-surface">Localização</h2>
              <Input label="Endereço" placeholder="Rua, número, bairro" value={address} onChange={(e) => setAddress(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cidade" placeholder="Ex: Caucaia" value={city} onChange={(e) => setCity(e.target.value)} required />
                <Select label="Estado" options={STATES_BR} value={state} onChange={(e) => setStateVal(e.target.value)} />
              </div>
            </div>

            <div className="card-soft p-6 flex flex-col gap-4">
              <h2 className="text-title-lg font-bold text-on-surface">Fotos</h2>
              <p className="text-body-md text-secondary">Até 10 fotos. A primeira será a capa.</p>
              <div className="grid grid-cols-5 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-low group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute top-1 left-1 bg-primary text-on-primary text-[9px] font-bold px-1 py-0.5 rounded">Capa</span>}
                    <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
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

            <div className="card-soft p-6 flex flex-col gap-4">
              <h2 className="text-title-lg font-bold text-on-surface">Detalhes</h2>
              <Input label="Características (separadas por vírgula)" placeholder="Ex: piscina, churrasqueira, mobiliado, varanda" value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)} />
              <div className="flex flex-col gap-1">
                <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Descrição</label>
                <TiptapEditor value={description} onChange={setDescription} placeholder="Descreva o imóvel em detalhes..." />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Publicar imóvel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
