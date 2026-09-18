'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { vehiclesApi } from '@/lib/api'
import toast from 'react-hot-toast'

const TYPE_OPTIONS = [
  { value: 'carro', label: 'Carro' },
  { value: 'moto', label: 'Moto' },
  { value: 'lancha', label: 'Lancha' },
  { value: 'jetski', label: 'Jet Ski' },
  { value: 'quadriciclo', label: 'Quadriciclo' },
  { value: 'trailer', label: 'Trailer' },
]

const FUEL_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'eletrico', label: 'Elétrico' },
  { value: 'flex', label: 'Flex' },
  { value: 'hibrido', label: 'Híbrido' },
]

const TRANS_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'manual', label: 'Manual' },
  { value: 'automatico', label: 'Automático' },
  { value: 'cvt', label: 'CVT' },
]

const STATES_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map((s) => ({ value: s, label: s }))

export default function CriarVeiculoPage() {
  const router = useRouter()
  const { checking } = useRequireAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('carro')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [mileage, setMileage] = useState('')
  const [fuel, setFuel] = useState('')
  const [transmission, setTransmission] = useState('')
  const [color, setColor] = useState('')
  const [city, setCity] = useState('')
  const [stateUF, setStateUF] = useState('CE')
  const [price, setPrice] = useState('')
  const [featuresInput, setFeaturesInput] = useState('')
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
    if (!title.trim()) { toast.error('Informe o título.'); return }
    if (!description || description === '<p></p>') { toast.error('Adicione uma descrição.'); return }
    if (!city.trim() || !stateUF) { toast.error('Informe cidade e estado.'); return }
    if (!price || isNaN(parseFloat(price))) { toast.error('Informe o preço.'); return }

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

      await vehiclesApi.create({
        title: title.trim(),
        description,
        type,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
        mileage: mileage ? parseInt(mileage, 10) : undefined,
        fuel: fuel || undefined,
        transmission: transmission || undefined,
        color: color.trim() || undefined,
        city: city.trim(),
        state: stateUF,
        price: parseFloat(price),
        images: uploadedUrls.length ? uploadedUrls : undefined,
        features: features.length ? features : undefined,
      })

      toast.success('Veículo anunciado com sucesso!')
      router.push('/veiculos')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao criar veículo. Verifique os campos.')
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
              <h1 className="text-headline-lg font-display font-black text-primary">Anunciar Veículo</h1>
              <p className="text-body-md text-secondary">Preencha os dados do veículo para publicar no marketplace.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            {/* Info básica */}
            <div className="card-soft p-6 md:p-8 flex flex-col gap-5">
              <h2 className="text-title-lg font-display font-extrabold text-on-surface flex items-center gap-2">
                <Icon name="directions_car" size={20} className="text-primary" />
                Informações básicas
              </h2>

              <Input label="Título do anúncio" placeholder="Ex: Toyota Hilux SRX 4x4 2022" value={title} onChange={(e) => setTitle(e.target.value)} required />

              <div className="flex flex-col gap-1">
                <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Descrição</label>
                <TiptapEditor value={description} onChange={setDescription} placeholder="Descreva o veículo, conservação, opcionais, motivo da venda..." />
                <p className="text-label-md text-secondary">Não inclua telefone ou e-mail — use o chat da plataforma.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Tipo" options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} />
                <Input label="Cor" placeholder="Ex: Prata, Branco" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Marca" placeholder="Ex: Toyota, Honda, Yamaha" value={brand} onChange={(e) => setBrand(e.target.value)} />
                <Input label="Modelo" placeholder="Ex: Hilux SRX 2.8" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input label="Ano" type="number" min={1900} max={2100} placeholder="2022" value={year} onChange={(e) => setYear(e.target.value)} />
                <Input label="Quilometragem (km)" type="number" min="0" placeholder="45000" value={mileage} onChange={(e) => setMileage(e.target.value)} />
                <Input label="Preço (R$)" type="number" min="0" step="0.01" placeholder="189000" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Combustível" options={FUEL_OPTIONS} value={fuel} onChange={(e) => setFuel(e.target.value)} />
                <Select label="Transmissão" options={TRANS_OPTIONS} value={transmission} onChange={(e) => setTransmission(e.target.value)} />
              </div>

              <Input label="Itens / Opcionais (separados por vírgula)" placeholder="Ex: ar condicionado, 4x4, multimídia, couro" value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)} />
            </div>

            {/* Localização */}
            <div className="card-soft p-6 md:p-8 flex flex-col gap-5">
              <h2 className="text-title-lg font-display font-extrabold text-on-surface">Localização</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cidade" placeholder="Ex: Fortaleza" value={city} onChange={(e) => setCity(e.target.value)} required />
                <Select label="Estado" options={STATES_BR} value={stateUF} onChange={(e) => setStateUF(e.target.value)} />
              </div>
            </div>

            {/* Fotos */}
            <div className="card-soft p-6 md:p-8 flex flex-col gap-5">
              <h2 className="text-title-lg font-display font-extrabold text-on-surface">Fotos</h2>
              <p className="text-body-md text-secondary">Adicione até 10 fotos. A primeira será a capa.</p>

              <div className="grid grid-cols-5 gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface-container-low group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute top-1 left-1 bg-primary text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded">Capa</span>}
                    <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Icon name="delete" size={20} className="text-white" />
                    </button>
                  </div>
                ))}
                {images.length < 10 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-fixed transition-colors">
                    <Icon name="add_photo_alternate" size={28} className="text-outline mb-1" />
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Adicionar</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">Cancelar</Button>
              <Button type="submit" loading={loading} className="flex-1">Publicar veículo</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
