'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { kiteSchoolApi } from '@/lib/api'
import type { CourseCategory } from '@/types/escola'
import toast from 'react-hot-toast'

export default function CategoriasPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CourseCategory | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '' })
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    kiteSchoolApi.listCategories()
      .then((r) => {
        const cats: CourseCategory[] = Array.isArray(r.data) ? r.data : r.data.data ?? r.data ?? []
        setCategories(cats)
      })
      .catch(() => toast.error('Erro ao carregar categorias.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', icon: '' })
    setModalOpen(true)
  }

  function openEdit(cat: CourseCategory) {
    setEditing(cat)
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? '', icon: cat.icon ?? '' })
    setModalOpen(true)
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Nome obrigatório.'); return }
    setSaving(true)
    try {
      if (editing) {
        // kiteSchoolApi has no typed helper for categories update — use fetch directly
        const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
        const res = await fetch(`/api/kite-school/categories/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ name: form.name.trim(), slug: form.slug.trim() || undefined, description: form.description || undefined, icon: form.icon || undefined }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const msg = (body as { message?: string | string[] }).message
          throw new Error(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Erro ao atualizar.')
        }
        toast.success('Categoria atualizada!')
      } else {
        await kiteSchoolApi.createCategory({ name: form.name.trim(), slug: form.slug.trim() || undefined, description: form.description || undefined, icon: form.icon || undefined })
        toast.success('Categoria criada!')
      }
      setModalOpen(false)
      load()
    } catch (err: unknown) {
      const msg = (err as Error).message || (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao salvar.'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  async function onDelete(cat: CourseCategory) {
    if (!confirm(`Excluir categoria "${cat.name}"?`)) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
      const res = await fetch(`/api/kite-school/categories/${cat.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = (body as { message?: string }).message ?? 'Erro ao excluir.'
        throw new Error(msg)
      }
      toast.success('Categoria excluída.')
      load()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao excluir.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="header-blur sticky top-0 z-40 border-b border-outline-variant">
        <div className="max-w-5xl mx-auto px-margin-desktop h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/escola" className="p-2 hover:bg-surface-container rounded-lg transition-colors">
              <Icon name="arrow_back" size={20} />
            </a>
            <h1 className="text-headline-lg font-display font-black text-primary">Categorias — Escola</h1>
          </div>
          <Button onClick={openCreate}>
            <Icon name="add" size={18} /> Nova categoria
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-margin-desktop py-8">
        <p className="text-body-md text-secondary mb-6">Gerencie categorias de cursos da Kite School (admin).</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="card-soft p-12 text-center">
            <Icon name="category" size={40} className="text-outline-variant mb-3" />
            <p className="text-body-md text-secondary">Nenhuma categoria cadastrada.</p>
            <Button onClick={openCreate} className="mt-4">Criar primeira categoria</Button>
          </div>
        ) : (
          <div className="card-soft overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-container border-b border-outline-variant">
                <tr>
                  <th className="text-left px-4 py-3 text-label-md uppercase tracking-wider text-on-surface-variant">Categoria</th>
                  <th className="text-left px-4 py-3 text-label-md uppercase tracking-wider text-on-surface-variant">Slug</th>
                  <th className="text-left px-4 py-3 text-label-md uppercase tracking-wider text-on-surface-variant">Cursos</th>
                  <th className="text-left px-4 py-3 text-label-md uppercase tracking-wider text-on-surface-variant">Ícone</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-surface-container transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="trust-chip-icon !w-10 !h-10 shrink-0">
                          <Icon name={cat.icon || 'school'} size={20} />
                        </span>
                        <div>
                          <div className="text-body-md font-bold text-on-surface">{cat.name}</div>
                          {cat.description && <div className="text-label-md text-secondary truncate max-w-[280px]">{cat.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-md text-secondary font-mono text-sm">{cat.slug}</td>
                    <td className="px-4 py-3">
                      <Badge variant="pending">{cat._count?.courses ?? 0}</Badge>
                    </td>
                    <td className="px-4 py-3 text-body-md text-secondary">{cat.icon || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(cat)} className="p-2 hover:bg-surface-container rounded-lg transition-colors" title="Editar">
                          <Icon name="edit" size={18} className="text-secondary" />
                        </button>
                        <button onClick={() => onDelete(cat)} className="p-2 hover:bg-error-container rounded-lg transition-colors" title="Excluir">
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
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Categoria' : 'Nova Categoria'} size="md">
        <form onSubmit={onSave} className="flex flex-col gap-unit-md">
          <Input label="Nome" placeholder="Ex: Kitesurf" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Slug (opcional)" placeholder="Ex: kitesurf — vazio = auto" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input label="Ícone (Material Symbol)" placeholder="Ex: school, air, surfing" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <Textarea label="Descrição" placeholder="Descrição opcional..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <Button type="submit" loading={saving} className="w-full">{editing ? 'Salvar alterações' : 'Criar categoria'}</Button>
        </form>
      </Modal>
    </div>
  )
}
