'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { listingsApi } from '@/lib/api'
import type { Listing } from '@/types'
import toast from 'react-hot-toast'

const CATEGORIES = ['Kitesurf', 'Wingfoil', 'Kitefoil', 'Kitewave', 'Acessórios'].map((c) => ({ value: c.toLowerCase(), label: c }))
const BRANDS = ['Duotone', 'Core', 'North', 'Cabrinha', 'F-One', 'Naish', 'Slingshot', 'Best', 'Flysurfer', 'Liquid Force', 'ION', 'Outro'].map((b) => ({ value: b.toLowerCase(), label: b }))
const STATES_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map((s) => ({ value: s, label: s }))
const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'draft', label: 'Rascunho' },
]

export default function EditarAnuncioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [form, setForm] = useState({ title: '', category: '', brand: '', model: '', condition: 'used' as 'new' | 'used', price: '', city: '', state: 'CE', description: '', status: 'active' as Listing['status'] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listingsApi.get(id).then((r) => {
      const l: Listing = r.data
      setListing(l)
      setForm({
        title: l.title,
        category: l.category,
        brand: l.brand ?? '',
        model: l.model ?? '',
        condition: l.condition,
        price: String(l.price),
        city: l.city,
        state: l.state,
        description: l.description,
        status: l.status,
      })
    }).catch(() => { toast.error('Anúncio não encontrado.'); router.back() })
  }, [id, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await listingsApi.update(id, { ...form, price: parseFloat(form.price) })
      toast.success('Anúncio atualizado!')
      router.push('/painel/anuncios')
    } catch { toast.error('Erro ao atualizar.') }
    finally { setLoading(false) }
  }

  if (!listing) return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 p-unit-xl overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-unit-xl">
            <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
              <Icon name="arrow_back" size={20} />
            </button>
            <h1 className="text-headline-lg font-display font-black text-primary">Editar Anúncio</h1>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-unit-xl">
            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Informações básicas</h2>
              <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <div className="grid grid-cols-2 gap-unit-md">
                <Select label="Categoria" options={CATEGORIES} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <Select label="Marca" options={BRANDS} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <Input label="Modelo" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              <div className="flex gap-unit-md">
                {(['used', 'new'] as const).map((c) => (
                  <label key={c} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="condition" checked={form.condition === c} onChange={() => setForm({ ...form, condition: c })} className="w-4 h-4 text-primary" />
                    <span className="text-body-md">{c === 'new' ? 'Novo' : 'Usado'}</span>
                  </label>
                ))}
              </div>
              <Input label="Preço (R$)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Listing['status'] })} />
            </div>

            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Localização</h2>
              <div className="grid grid-cols-2 gap-unit-md">
                <Input label="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                <Select label="Estado" options={STATES_BR} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
            </div>

            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Descrição</h2>
              <TiptapEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">Cancelar</Button>
              <Button type="submit" loading={loading} className="flex-1">Salvar alterações</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
