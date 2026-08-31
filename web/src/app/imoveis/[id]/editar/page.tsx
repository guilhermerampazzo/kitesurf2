'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

export default function EditarImovelPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'casa',
    purpose: 'venda',
    price: '',
    bedrooms: '2',
    bathrooms: '1',
    area: '',
    address: '',
    city: '',
    state: 'CE',
    featuresInput: '',
  })

  useEffect(() => {
    if (!localStorage.getItem('kite_access_token')) {
      toast.error('Faça login para editar.')
      router.push('/login')
      return
    }
  }, [router])

  useEffect(() => {
    propertiesApi
      .get(id)
      .then((r) => {
        const p = r.data?.data ?? r.data
        setForm({
          title: p.title ?? '',
          description: p.description ?? '',
          type: p.type ?? 'casa',
          purpose: p.purpose ?? 'venda',
          price: String(p.price ?? ''),
          bedrooms: String(p.bedrooms ?? 2),
          bathrooms: String(p.bathrooms ?? 1),
          area: p.area != null ? String(p.area) : '',
          address: p.address ?? '',
          city: p.city ?? '',
          state: p.state ?? 'CE',
          featuresInput: Array.isArray(p.features) ? p.features.join(', ') : '',
        })
      })
      .catch(() => {
        toast.error('Imóvel não encontrado.')
        router.back()
      })
      .finally(() => setFetching(false))
  }, [id, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const features = form.featuresInput.split(',').map((s) => s.trim()).filter(Boolean)
      await propertiesApi.update(id, {
        title: form.title,
        description: form.description,
        type: form.type,
        purpose: form.purpose,
        price: parseFloat(form.price),
        bedrooms: parseInt(form.bedrooms, 10),
        bathrooms: parseInt(form.bathrooms, 10),
        area: form.area ? parseFloat(form.area) : undefined,
        address: form.address,
        city: form.city,
        state: form.state,
        features,
      })
      toast.success('Imóvel atualizado!')
      router.push(`/imoveis/${id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao atualizar imóvel.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
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
            <h1 className="text-headline-lg font-display font-black text-primary">Editar Imóvel</h1>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="card-soft p-6 flex flex-col gap-4">
              <h2 className="text-title-lg font-bold text-on-surface">Informações básicas</h2>
              <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Tipo" options={TYPE_OPTIONS} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                <Select label="Finalidade" options={PURPOSE_OPTIONS} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
              </div>
              <Input label="Preço (R$)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <div className="grid grid-cols-3 gap-4">
                <Input label="Quartos" type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
                <Input label="Banheiros" type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
                <Input label="Área (m²)" type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
              </div>
            </div>

            <div className="card-soft p-6 flex flex-col gap-4">
              <h2 className="text-title-lg font-bold text-on-surface">Localização</h2>
              <Input label="Endereço" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                <Select label="Estado" options={STATES_BR} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
            </div>

            <div className="card-soft p-6 flex flex-col gap-4">
              <h2 className="text-title-lg font-bold text-on-surface">Detalhes</h2>
              <Input label="Características (separadas por vírgula)" value={form.featuresInput} onChange={(e) => setForm({ ...form, featuresInput: e.target.value })} />
              <div className="flex flex-col gap-1">
                <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Descrição</label>
                <TiptapEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Salvar alterações
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
