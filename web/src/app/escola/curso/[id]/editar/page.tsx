'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { kiteSchoolApi } from '@/lib/api'
import type { Course, CourseCategory, Lesson } from '@/types/escola'
import { COURSE_LEVEL_OPTIONS, formatDuration } from '@/types/escola'
import toast from 'react-hot-toast'

export default function EditarCursoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    level: 'iniciante',
    price: '',
    isFree: true,
    freeLessons: '0',
    status: 'active',
  })
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Lessons
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonModalOpen, setLessonModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    videoType: 'upload' as 'upload' | 'youtube',
    youtubeUrl: '',
    duration: '',
    order: '',
    isPreview: false,
    isFree: false,
  })
  const [lessonFile, setLessonFile] = useState<File | null>(null)
  const [lessonSaving, setLessonSaving] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('kite_access_token')) {
      toast.error('Faça login para editar.')
      router.push('/login')
      return
    }
  }, [router])

  useEffect(() => {
    kiteSchoolApi.listCategories()
      .then((r) => {
        const cats: CourseCategory[] = Array.isArray(r.data) ? r.data : r.data.data ?? []
        setCategories(cats)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    kiteSchoolApi.getCourse(id)
      .then((r) => {
        const c: Course = r.data
        setCourse(c)
        setForm({
          title: c.title,
          description: c.description,
          categoryId: c.categoryId,
          level: c.level,
          price: String(c.price),
          isFree: c.isFree,
          freeLessons: String(c.freeLessons),
          status: c.status,
        })
        if (c.thumbnail) setThumbPreview(c.thumbnail)
        setLessons(c.lessons ?? [])
      })
      .catch(() => {
        toast.error('Curso não encontrado.')
        router.back()
      })
  }, [id, router])

  async function loadLessons() {
    try {
      const { data } = await kiteSchoolApi.listLessons(id)
      const ls: Lesson[] = Array.isArray(data) ? data : data.data ?? []
      setLessons(ls)
    } catch {}
  }

  function handleThumbChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setThumbFile(f)
    if (f) {
      const reader = new FileReader()
      reader.onload = (ev) => setThumbPreview(ev.target?.result as string)
      reader.readAsDataURL(f)
    }
  }

  async function onSaveCourse(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Título obrigatório.'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      fd.append('description', form.description)
      fd.append('categoryId', form.categoryId)
      fd.append('level', form.level)
      fd.append('isFree', String(form.isFree))
      fd.append('price', form.isFree ? '0' : form.price || '0')
      fd.append('freeLessons', form.freeLessons || '0')
      fd.append('status', form.status)
      if (thumbFile) fd.append('thumbnail', thumbFile)

      const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
      const res = await fetch(`/api/kite-school/courses/${id}`, {
        method: 'PUT',
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = (body as { message?: string | string[] }).message
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Erro ao salvar.')
      }
      toast.success('Curso atualizado!')
      const updated = await res.json().catch(() => null)
      if (updated) setCourse(updated)
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  async function onDeleteCourse() {
    if (!confirm('Excluir este curso? Todas as aulas e matrículas serão removidas.')) return
    setDeleting(true)
    try {
      await kiteSchoolApi.deleteCourse(id)
      toast.success('Curso excluído.')
      router.push('/escola')
    } catch {
      toast.error('Erro ao excluir.')
    } finally { setDeleting(false) }
  }

  // ── Lessons ──

  function openCreateLesson() {
    setEditingLesson(null)
    setLessonForm({
      title: '',
      description: '',
      videoType: 'upload',
      youtubeUrl: '',
      duration: '',
      order: String(lessons.length),
      isPreview: false,
      isFree: false,
    })
    setLessonFile(null)
    setLessonModalOpen(true)
  }

  function openEditLesson(lesson: Lesson) {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      description: lesson.description ?? '',
      videoType: lesson.videoType,
      youtubeUrl: lesson.videoType === 'youtube' ? (lesson.videoUrl ?? lesson.youtubeId ?? '') : '',
      duration: lesson.duration != null ? String(lesson.duration) : '',
      order: String(lesson.order),
      isPreview: lesson.isPreview,
      isFree: lesson.isFree,
    })
    setLessonFile(null)
    setLessonModalOpen(true)
  }

  async function saveLesson(e: React.FormEvent) {
    e.preventDefault()
    if (!lessonForm.title.trim()) { toast.error('Título da aula obrigatório.'); return }
    setLessonSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', lessonForm.title.trim())
      if (lessonForm.description) fd.append('description', lessonForm.description)
      fd.append('videoType', lessonForm.videoType)
      if (lessonForm.videoType === 'youtube') {
        if (lessonForm.youtubeUrl) fd.append('youtubeUrl', lessonForm.youtubeUrl)
      } else {
        if (lessonFile) fd.append('video', lessonFile)
      }
      if (lessonForm.duration) fd.append('duration', lessonForm.duration)
      if (lessonForm.order) fd.append('order', lessonForm.order)
      fd.append('isPreview', String(lessonForm.isPreview))
      fd.append('isFree', String(lessonForm.isFree))

      const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      let res: Response
      if (editingLesson) {
        res = await fetch(`/api/kite-school/lessons/${editingLesson.id}`, {
          method: 'PUT',
          body: fd,
          headers,
        })
      } else {
        res = await fetch(`/api/kite-school/courses/${id}/lessons`, {
          method: 'POST',
          body: fd,
          headers,
        })
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = (body as { message?: string | string[] }).message
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Erro ao salvar aula.')
      }
      toast.success(editingLesson ? 'Aula atualizada!' : 'Aula criada!')
      setLessonModalOpen(false)
      loadLessons()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao salvar aula.')
    } finally { setLessonSaving(false) }
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm('Excluir esta aula?')) return
    try {
      await kiteSchoolApi.deleteLesson(lessonId)
      toast.success('Aula excluída.')
      setLessons((prev) => prev.filter((l) => l.id !== lessonId))
    } catch {
      toast.error('Erro ao excluir aula.')
    }
  }

  if (!course) {
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

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-unit-xl">
            <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
              <Icon name="arrow_back" size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-headline-lg font-display font-black text-primary truncate">Editar Curso</h1>
              <p className="text-body-md text-secondary truncate">{course.title}</p>
            </div>
            <Link href={`/escola/curso/${id}`} className="hidden sm:inline-flex items-center gap-2 text-body-md font-bold text-primary hover:text-accent-strong">
              <Icon name="visibility" size={16} /> Ver curso
            </Link>
          </div>

          {/* Course form */}
          <form onSubmit={onSaveCourse} className="flex flex-col gap-unit-xl mb-unit-xl">
            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Informações básicas</h2>
              <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-md">
                <Select
                  label="Categoria"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                />
                <Select label="Nível" options={COURSE_LEVEL_OPTIONS} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} className="w-5 h-5 rounded border-outline-variant text-primary" />
                  <span className="text-body-md font-semibold">{form.isFree ? 'Gratuito' : 'Pago'}</span>
                </label>
              </div>

              {!form.isFree && (
                <Input label="Preço (R$)" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-md">
                <Input label="Aulas gratuitas iniciais" type="number" min="0" value={form.freeLessons} onChange={(e) => setForm({ ...form, freeLessons: e.target.value })} />
                <Select
                  label="Status"
                  options={[
                    { value: 'active', label: 'Ativo' },
                    { value: 'draft', label: 'Rascunho' },
                    { value: 'archived', label: 'Arquivado' },
                  ]}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                />
              </div>
            </div>

            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Capa</h2>
              {thumbPreview && (
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-surface-container-low">
                  <img src={thumbPreview} alt="Capa" className="w-full h-full object-cover" />
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleThumbChange} className="text-body-md" />
              <p className="text-label-md text-secondary">Deixe vazio para manter a capa atual. Max 15MB.</p>
            </div>

            <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
              <h2 className="text-title-lg font-bold text-on-surface">Descrição</h2>
              <TiptapEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">Cancelar</Button>
              <Button type="submit" loading={saving} className="flex-1">Salvar alterações</Button>
            </div>
          </form>

          {/* Danger zone */}
          <div className="card-soft p-unit-lg border border-error/30 mb-unit-xl">
            <h3 className="text-title-lg font-bold text-error mb-2 flex items-center gap-2"><Icon name="warning" size={18} /> Zona de risco</h3>
            <p className="text-body-md text-secondary mb-4">Excluir o curso remove permanentemente aulas e matrículas associadas.</p>
            <Button variant="danger" onClick={onDeleteCourse} loading={deleting}>
              <Icon name="delete" size={18} /> Excluir curso
            </Button>
          </div>

          {/* Lessons management */}
          <div className="card-soft p-unit-lg flex flex-col gap-unit-md">
            <div className="flex items-center justify-between">
              <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
                <Icon name="menu_book" size={20} className="text-primary" /> Aulas
                <Badge variant="pending">{lessons.length}</Badge>
              </h2>
              <Button size="sm" onClick={openCreateLesson}>
                <Icon name="add" size={16} /> Nova aula
              </Button>
            </div>

            {lessons.length === 0 ? (
              <div className="py-8 text-center">
                <Icon name="video_library" size={32} className="text-outline-variant mb-2" />
                <p className="text-body-md text-secondary">Nenhuma aula ainda. Crie a primeira!</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-outline-variant">
                {lessons
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((lesson, idx) => (
                    <div key={lesson.id} className="flex items-center gap-3 py-3">
                      <span className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold text-sm shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-body-md font-bold text-on-surface truncate flex items-center gap-2">
                          {lesson.title}
                          {lesson.isPreview && <span className="text-[10px] font-bold uppercase bg-accent-soft text-on-tertiary-fixed px-1.5 py-0.5 rounded-full">Preview</span>}
                          {lesson.isFree && !lesson.isPreview && <span className="text-[10px] font-bold uppercase bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">Grátis</span>}
                        </div>
                        <div className="flex items-center gap-2 text-label-md text-secondary">
                          <span className="capitalize flex items-center gap-1">
                            <Icon name={lesson.videoType === 'youtube' ? 'smart_display' : 'video_file'} size={12} /> {lesson.videoType}
                          </span>
                          <span>·</span>
                          <span>{formatDuration(lesson.duration)}</span>
                          <span>·</span>
                          <span>ordem {lesson.order}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditLesson(lesson)} className="p-2 hover:bg-surface-container rounded-lg transition-colors" title="Editar">
                          <Icon name="edit" size={18} className="text-secondary" />
                        </button>
                        <button onClick={() => deleteLesson(lesson.id)} className="p-2 hover:bg-error-container rounded-lg transition-colors" title="Excluir">
                          <Icon name="delete" size={18} className="text-secondary hover:text-error" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Lesson modal */}
      <Modal open={lessonModalOpen} onClose={() => setLessonModalOpen(false)} title={editingLesson ? 'Editar Aula' : 'Nova Aula'} size="lg">
        <form onSubmit={saveLesson} className="flex flex-col gap-unit-md">
          <Input
            label="Título da aula"
            placeholder="Ex: Introdução e equipamentos"
            value={lessonForm.title}
            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
            required
          />
          <Textarea
            label="Descrição (opcional)"
            placeholder="Resumo do conteúdo desta aula..."
            value={lessonForm.description}
            onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-unit-md">
            <div className="flex flex-col gap-unit-xs">
              <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Tipo de vídeo</label>
              <div className="flex gap-2">
                {(['upload', 'youtube'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLessonForm({ ...lessonForm, videoType: t })}
                    className={`flex-1 py-2.5 rounded-xl text-body-md font-semibold border transition-colors capitalize ${lessonForm.videoType === t ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant hover:border-primary'}`}
                  >
                    <Icon name={t === 'youtube' ? 'smart_display' : 'upload_file'} size={16} className="inline mr-1" />
                    {t === 'youtube' ? 'YouTube' : 'Upload'}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Ordem" type="number" min="0" value={lessonForm.order} onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })} />
          </div>

          {lessonForm.videoType === 'youtube' ? (
            <Input
              label="Link do YouTube"
              placeholder="https://youtube.com/watch?v=..."
              value={lessonForm.youtubeUrl}
              onChange={(e) => setLessonForm({ ...lessonForm, youtubeUrl: e.target.value })}
              required={lessonForm.videoType === 'youtube'}
            />
          ) : (
            <div className="flex flex-col gap-unit-xs">
              <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">
                Arquivo de vídeo {editingLesson ? '(deixe vazio para manter)' : ''}
              </label>
              <input type="file" accept="video/*" onChange={(e) => setLessonFile(e.target.files?.[0] ?? null)} className="text-body-md border border-outline-variant rounded-xl px-3 py-2 bg-surface-container-lowest" />
              <span className="text-label-md text-secondary">MP4, WebM — Max 50MB</span>
              {lessonFile && <span className="text-body-md text-primary">{lessonFile.name} — {(lessonFile.size / 1024 / 1024).toFixed(2)} MB</span>}
              {editingLesson?.videoUrl && !lessonFile && <span className="text-body-md text-secondary truncate">Atual: {editingLesson.videoUrl}</span>}
            </div>
          )}

          <Input label="Duração (segundos)" type="number" min="0" placeholder="Ex: 600" value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} />

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={lessonForm.isPreview} onChange={(e) => setLessonForm({ ...lessonForm, isPreview: e.target.checked })} className="w-4 h-4 rounded border-outline-variant text-primary" />
              <span className="text-body-md">Preview (liberada sem matrícula)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={lessonForm.isFree} onChange={(e) => setLessonForm({ ...lessonForm, isFree: e.target.checked })} className="w-4 h-4 rounded border-outline-variant text-primary" />
              <span className="text-body-md">Gratuita</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setLessonModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={lessonSaving} className="flex-1">{editingLesson ? 'Salvar' : 'Criar aula'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
