'use client'
import { useEffect, useState, useRef } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { adminApi } from '@/lib/api'
import type { AdBanner } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const SLOT_OPTIONS = [
  { value: 'top',              label: 'Topo (banner horizontal)' },
  { value: 'sidebar',         label: 'Lateral (sidebar)' },
  { value: 'between-listings',label: 'Entre listagens' },
  { value: 'footer',          label: 'Rodapé' },
  { value: 'event-top',       label: 'Evento — topo' },
]

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<AdBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ slot: 'sidebar', advertiser: '', linkUrl: '', startsAt: '', endsAt: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function load() {
    setLoading(true)
    adminApi.banners()
      .then((r) => setBanners(r.data.data ?? []))
      .catch(() => toast.error('Erro ao carregar banners.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function saveBanner(e: React.FormEvent) {
    e.preventDefault()
    if (!imageFile) { toast.error('Selecione uma imagem.'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('file', imageFile)
      const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
      const uploadRes = await fetch('/api/uploads/image', { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const { url } = await uploadRes.json()
      await adminApi.createBanner({ ...form, imageUrl: url })
      toast.success('Banner criado!')
      setModalOpen(false)
      setForm({ slot: 'sidebar', advertiser: '', linkUrl: '', startsAt: '', endsAt: '' })
      setImageFile(null)
      load()
    } catch { toast.error('Erro ao criar banner.') }
    finally { setSaving(false) }
  }

  async function toggleStatus(b: AdBanner) {
    try {
      await adminApi.updateBanner(b.id, { status: b.status === 'active' ? 'paused' : 'active' })
      load()
    } catch { toast.error('Erro ao atualizar.') }
  }

  async function deleteBanner(id: string) {
    if (!confirm('Excluir banner?')) return
    try { await adminApi.deleteBanner(id); load() }
    catch { toast.error('Erro ao excluir.') }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-unit-xl overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-unit-xl">
            <div>
              <h1 className="text-headline-lg font-display font-black text-primary">Gestor de Banners</h1>
              <p className="text-body-md text-secondary">Gerencie campanhas publicitárias e banners rotativos</p>
            </div>
            <Button onClick={() => setModalOpen(true)}>
              <Icon name="add" size={18} /> Novo banner
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-unit-xl">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="card-soft overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-container border-b border-outline-variant">
                  <tr>
                    <th className="text-left px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Banner</th>
                    <th className="text-left px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Slot</th>
                    <th className="text-right px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Impressões</th>
                    <th className="text-right px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Cliques</th>
                    <th className="text-left px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Período</th>
                    <th className="text-left px-unit-md py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-unit-md py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {banners.length === 0 && (
                    <tr><td colSpan={7} className="px-unit-md py-unit-xl text-center text-secondary">Nenhum banner cadastrado.</td></tr>
                  )}
                  {banners.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-container transition-colors">
                      <td className="px-unit-md py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 rounded overflow-hidden bg-surface-container-low shrink-0">
                            <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-body-md font-bold text-on-surface">{b.advertiser}</span>
                        </div>
                      </td>
                      <td className="px-unit-md py-3 text-body-md text-secondary">{b.slotId}</td>
                      <td className="px-unit-md py-3 text-body-md text-right">{b.impressions.toLocaleString()}</td>
                      <td className="px-unit-md py-3 text-body-md text-right">{b.clicks.toLocaleString()}</td>
                      <td className="px-unit-md py-3 text-body-md text-secondary text-[12px]">
                        {formatDate(b.startsAt)} → {formatDate(b.endsAt)}
                      </td>
                      <td className="px-unit-md py-3">
                        <span className={`text-label-md px-2 py-0.5 rounded-full ${
                          b.status === 'active' ? 'bg-green-100 text-green-800' :
                          b.status === 'paused' ? 'bg-amber-100 text-amber-800' :
                          'bg-surface-container text-secondary'
                        }`}>
                          {b.status === 'active' ? 'Ativo' : b.status === 'paused' ? 'Pausado' : 'Expirado'}
                        </span>
                      </td>
                      <td className="px-unit-md py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => toggleStatus(b)} className="p-1.5 hover:bg-surface-container rounded-lg transition-colors">
                            <Icon name={b.status === 'active' ? 'pause' : 'play_arrow'} size={18} className="text-secondary" />
                          </button>
                          <button onClick={() => deleteBanner(b.id)} className="p-1.5 hover:bg-error-container rounded-lg transition-colors">
                            <Icon name="delete" size={18} className="text-secondary hover:text-error" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Banner" size="md">
        <form onSubmit={saveBanner} className="flex flex-col gap-unit-md">
          <div className="flex flex-col gap-unit-xs">
            <label className="text-label-md text-on-surface uppercase tracking-wider">Imagem do banner</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-outline-variant rounded-xl p-unit-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-fixed transition-all"
            >
              {imageFile ? (
                <img src={URL.createObjectURL(imageFile)} alt="" className="max-h-32 rounded-lg object-contain" />
              ) : (
                <>
                  <Icon name="upload_file" size={40} className="text-outline mb-2" />
                  <span className="text-body-md text-secondary">Clique para selecionar</span>
                  <span className="text-label-md text-outline">PNG, JPG, WebP — Max 15MB</span>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="hidden" />
            </div>
          </div>

          <div className="flex flex-col gap-unit-xs">
            <label className="text-label-md text-on-surface uppercase tracking-wider">Slot</label>
            <select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} className="border border-outline-variant rounded-lg px-unit-md py-unit-md text-body-md bg-surface-container-lowest focus:outline-none focus:border-primary">
              {SLOT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <Input label="Anunciante" value={form.advertiser} onChange={(e) => setForm({ ...form, advertiser: e.target.value })} placeholder="Nome da empresa" required />
          <Input label="URL de destino" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." required />

          <div className="grid grid-cols-2 gap-unit-md">
            <Input label="Data início" type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
            <Input label="Data fim" type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required />
          </div>

          <Button type="submit" loading={saving} className="w-full">Criar banner</Button>
        </form>
      </Modal>
    </div>
  )
}
