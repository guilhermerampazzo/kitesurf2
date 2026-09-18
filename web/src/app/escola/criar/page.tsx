'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { kiteSchoolApi } from '@/lib/api'
import type { CourseCategory } from '@/types/escola'
import { COURSE_LEVEL_OPTIONS } from '@/types/escola'
import toast from 'react-hot-toast'

export default function CriarCursoPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [level, setLevel] = useState('iniciante')
  const [price, setPrice] = useState('')
  const [isFree, setIsFree] = useState(true)
  const [freeLessons, setFreeLessons] = useState('0')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { checking } = useRequireAuth()

  useEffect(() => {
    kiteSchoolApi.listCategories()
      .then((r) => {
        const cats: CourseCategory[] = Array.isArray(r.data) ? r.data : r.data.data ?? []
        setCategories(cats)
        if (cats.length > 0) setCategoryId(cats[0].id)
      })
      .catch(() => toast.error('Erro ao carregar categorias.'))
  }, [])

  function handleThumbChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setThumbnailFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setThumbnailPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setThumbnailPreview(null)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Informe o título.'); return }
    if (!description || description === '<p></p>') { toast.error('Adicione uma descrição.'); return }
    if (!categoryId) { toast.error('Selecione uma categoria.'); return }
    if (!isFree && (!price || parseFloat(price) <= 0)) { toast.error('Informe um preço válido para curso pago.'); return }

    setLoading(true)
    try {
      const form = new FormData()
      form.append('title', title.trim())
      form.append('description', description)
      form.append('categoryId', categoryId)
      form.append('level', level)
      form.append('isFree', String(isFree))
      form.append('price', isFree ? '0' : price)
      form.append('freeLessons', freeLessons || '0')
      if (thumbnailFile) form.append('thumbnail', thumbnailFile)

      const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
      // Use fetch with FormData to preserve file; api instance sends JSON by default
      const res = await fetch('/api/kite-school/courses', {
        method: 'POST',
        body: form,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = (body as { message?: string | string[] }).message
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Erro ao criar curso.')
      }
      const created = await res.json()
      const cid: string = created.id ?? created.data?.id ?? created.course?.id ?? ''
      toast.success('Curso criado com sucesso!')
      router.push(cid ? `/escola/curso/${cid}` : '/escola')
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Erro ao criar curso.'
      toast.error(msg)
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
    <>
      <Header />
      <main className="header-offset max-w-container mx-auto px-margin-desktop pb-24 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-unit-xl">
            <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
              <Icon name="arrow_back" size={20} />
            </button>
            <div>
              <h1 className="text-headline-lg font-display font-black text-primary">Criar Curso</h1>
              <p className="text-body-md text-secondary">Compartilhe seu conhecimento com a comunidade Kite.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-unit-xl">
            {/* Basic info */}
            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Informações básicas</h2>

              <Input
                label="Título do curso"
                placeholder="Ex: Kitesurf do Zero — 6h intensivo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-md">
                <Select
                  label="Categoria"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                />
                <Select
                  label="Nível"
                  options={COURSE_LEVEL_OPTIONS}
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span className="text-body-md font-semibold text-on-surface flex items-center gap-2">
                    <Icon name={isFree ? 'volunteer_activism' : 'payments'} size={18} className={isFree ? 'text-green-600' : 'text-primary'} />
                    {isFree ? 'Curso gratuito' : 'Curso pago'}
                  </span>
                </label>
                {!isFree && (
                  <span className="text-label-md text-secondary">Preço obrigatório</span>
                )}
              </div>

              {!isFree && (
                <Input
                  label="Preço (R$)"
                  type="number"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required={!isFree}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-md">
                <Input
                  label="Aulas gratuitas (qtd. iniciais liberadas)"
                  type="number"
                  min="0"
                  value={freeLessons}
                  onChange={(e) => setFreeLessons(e.target.value)}
                />
                <div className="flex flex-col gap-unit-xs">
                  <span className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Pré-visualização</span>
                  <p className="text-body-md text-secondary">Alunos não matriculados poderão assistir às primeiras N aulas + previews.</p>
                </div>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Capa do curso</h2>
              <p className="text-body-md text-secondary">Imagem de destaque (opcional). Recomendado 16:9, até 15MB.</p>

              {thumbnailPreview ? (
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-surface-container-low group">
                  <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setThumbnailFile(null); setThumbnailPreview(null) }}
                    className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>
              ) : (
                <label className="aspect-[16/9] rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-fixed/30 transition-colors p-6 text-center">
                  <Icon name="add_photo_alternate" size={36} className="text-outline mb-2" />
                  <span className="text-body-md font-semibold text-on-surface">Clique para selecionar a capa</span>
                  <span className="text-label-md text-secondary">PNG, JPG, WebP — Max 15MB</span>
                  <input type="file" accept="image/*" onChange={handleThumbChange} className="hidden" />
                </label>
              )}
              {!thumbnailPreview && thumbnailFile === null && (
                <input type="file" accept="image/*" onChange={handleThumbChange} className="block text-body-md" />
              )}
            </div>

            {/* Description */}
            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Descrição</h2>
              <p className="text-body-md text-secondary">Detalhe o conteúdo, pré-requisitos e o que o aluno vai aprender.</p>
              <TiptapEditor value={description} onChange={setDescription} placeholder="Descreva o curso em detalhes..." />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                <Icon name="check" size={18} />
                Criar curso
              </Button>
            </div>

            <p className="text-label-md text-secondary text-center">
              Após criar, você poderá adicionar aulas na página de edição.
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}
