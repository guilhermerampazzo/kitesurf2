'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { blogApi, fashionApi } from '@/lib/api'
import toast from 'react-hot-toast'

const BLOG_CATEGORIES = [
  { value: 'moda', label: 'Moda' },
  { value: 'kite_style', label: 'Kite Style' },
  { value: 'tendencia', label: 'Tendência' },
  { value: 'entrevista', label: 'Entrevista' },
]

const FASHION_CATEGORIES = [
  { value: 'camiseta', label: 'Camiseta' },
  { value: 'bermuda', label: 'Bermuda' },
  { value: 'biquini', label: 'Biquíni' },
  { value: 'bone', label: 'Boné' },
  { value: 'wet_suit', label: 'Wet Suit' },
  { value: 'acessorio', label: 'Acessório' },
  { value: 'camisa', label: 'Camisa' },
  { value: 'calca', label: 'Calça' },
  { value: 'vestido', label: 'Vestido' },
  { value: 'saia', label: 'Saia' },
]

export default function ModaCriarPage() {
  const router = useRouter()
  const { checking } = useRequireAuth()
  const [activeTab, setActiveTab] = useState<'blog' | 'fashion'>('blog')

  // Blog state
  const [bTitle, setBTitle] = useState('')
  const [bExcerpt, setBExcerpt] = useState('')
  const [bContent, setBContent] = useState('')
  const [bCategory, setBCategory] = useState('moda')
  const [bTags, setBTags] = useState('')
  const [bCover, setBCover] = useState<File | null>(null)
  const [bCoverPreview, setBCoverPreview] = useState<string | null>(null)
  const [bLoading, setBLoading] = useState(false)

  // Fashion state
  const [fTitle, setFTitle] = useState('')
  const [fDescription, setFDescription] = useState('')
  const [fCategory, setFCategory] = useState('camiseta')
  const [fBrand, setFBrand] = useState('')
  const [fSize, setFSize] = useState('')
  const [fColor, setFColor] = useState('')
  const [fCondition, setFCondition] = useState<'new' | 'used'>('new')
  const [fPrice, setFPrice] = useState('')
  const [fImages, setFImages] = useState<File[]>([])
  const [fPreviews, setFPreviews] = useState<string[]>([])
  const [fLoading, setFLoading] = useState(false)

  async function uploadFile(file: File): Promise<string> {
    const form = new FormData()
    form.append('file', file)
    const token = typeof window !== 'undefined' ? localStorage.getItem('kite_access_token') : null
    const res = await fetch('/api/uploads/image', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!res.ok) throw new Error('Falha no upload')
    const { url } = await res.json()
    return url as string
  }

  function handleBlogCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBCover(file)
    const reader = new FileReader()
    reader.onload = (ev) => setBCoverPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleFashionImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (fImages.length + files.length > 8) { toast.error('Máximo 8 fotos.'); return }
    setFImages((prev) => [...prev, ...files])
    files.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (ev) => setFPreviews((prev) => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removeFashionImage(idx: number) {
    setFImages((prev) => prev.filter((_, i) => i !== idx))
    setFPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onBlogSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bTitle.trim()) { toast.error('Informe o título do post.'); return }
    if (!bContent || bContent === '<p></p>') { toast.error('Adicione o conteúdo.'); return }
    setBLoading(true)
    try {
      let coverImage: string | undefined
      if (bCover) coverImage = await uploadFile(bCover)
      const tags = bTags.split(',').map((t) => t.trim()).filter(Boolean)
      await blogApi.create({
        title: bTitle.trim(),
        excerpt: bExcerpt.trim() || undefined,
        content: bContent,
        coverImage,
        category: bCategory,
        tags: tags.length ? tags : undefined,
        status: 'published',
      })
      toast.success('Post publicado com sucesso!')
      router.push('/moda')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao criar post.')
    } finally {
      setBLoading(false)
    }
  }

  async function onFashionSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fTitle.trim()) { toast.error('Informe o título do item.'); return }
    if (!fDescription.trim()) { toast.error('Informe a descrição.'); return }
    if (!fPrice || isNaN(parseFloat(fPrice))) { toast.error('Preço inválido.'); return }
    setFLoading(true)
    try {
      const uploaded: string[] = []
      for (const img of fImages) {
        const url = await uploadFile(img)
        uploaded.push(url)
      }
      await fashionApi.create({
        title: fTitle.trim(),
        description: fDescription.trim(),
        category: fCategory,
        brand: fBrand.trim() || undefined,
        size: fSize.trim() || undefined,
        color: fColor.trim() || undefined,
        condition: fCondition,
        price: parseFloat(fPrice),
        images: uploaded.length ? uploaded : undefined,
      })
      toast.success('Produto cadastrado com sucesso!')
      router.push('/moda')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao criar produto.')
    } finally {
      setFLoading(false)
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
              <h1 className="text-headline-lg font-display font-black text-primary">Criar — Moda</h1>
              <p className="text-body-md text-secondary">Publique um post editorial ou um produto para a loja.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 p-1 bg-surface-container rounded-full w-fit">
            <button
              onClick={() => setActiveTab('blog')}
              className={`px-6 py-2.5 rounded-full text-body-md font-display font-bold transition-colors inline-flex items-center gap-2 ${activeTab === 'blog' ? 'bg-brand-gradient text-white shadow-soft' : 'text-secondary hover:text-primary'}`}
            >
              <Icon name="article" size={18} filled={activeTab === 'blog'} />
              Post do Blog
            </button>
            <button
              onClick={() => setActiveTab('fashion')}
              className={`px-6 py-2.5 rounded-full text-body-md font-display font-bold transition-colors inline-flex items-center gap-2 ${activeTab === 'fashion' ? 'bg-brand-gradient text-white shadow-soft' : 'text-secondary hover:text-primary'}`}
            >
              <Icon name="shopping_bag" size={18} filled={activeTab === 'fashion'} />
              Produto da Loja
            </button>
          </div>

          {activeTab === 'blog' ? (
            <form onSubmit={onBlogSubmit} className="flex flex-col gap-6">
              <div className="card-soft p-6 md:p-8 flex flex-col gap-5">
                <h2 className="text-title-lg font-display font-extrabold text-on-surface flex items-center gap-2">
                  <Icon name="edit_note" size={20} className="text-primary" />
                  Novo post editorial
                </h2>

                <Input label="Título" placeholder="Ex: 5 tendências kite style para o verão 2026" value={bTitle} onChange={(e) => setBTitle(e.target.value)} required />

                <Textarea label="Resumo (excerpt)" placeholder="Um parágrafo curto que aparece no card do blog..." value={bExcerpt} onChange={(e) => setBExcerpt(e.target.value)} rows={3} maxLength={500} />

                <div className="grid grid-cols-2 gap-4">
                  <Select label="Categoria" options={BLOG_CATEGORIES} value={bCategory} onChange={(e) => setBCategory(e.target.value)} />
                  <Input label="Tags (separadas por vírgula)" placeholder="Ex: verao, tendencia, praia" value={bTags} onChange={(e) => setBTags(e.target.value)} />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Imagem de capa</label>
                  {bCoverPreview ? (
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-surface-container-low">
                      <img src={bCoverPreview} alt="Capa" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setBCover(null); setBCoverPreview(null) }} className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors">
                        <Icon name="close" size={18} />
                      </button>
                    </div>
                  ) : (
                    <label className="aspect-[16/9] rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-fixed transition-colors p-8 text-center">
                      <Icon name="add_photo_alternate" size={32} className="text-outline mb-2" />
                      <span className="text-body-md font-bold text-secondary">Clique para adicionar capa</span>
                      <span className="text-label-md text-outline">Recomendado 1200×675px</span>
                      <input type="file" accept="image/*" onChange={handleBlogCover} className="hidden" />
                    </label>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Conteúdo</label>
                  <TiptapEditor value={bContent} onChange={setBContent} placeholder="Escreva o conteúdo completo do post..." />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">Cancelar</Button>
                <Button type="submit" loading={bLoading} className="flex-1">Publicar post</Button>
              </div>
            </form>
          ) : (
            <form onSubmit={onFashionSubmit} className="flex flex-col gap-6">
              <div className="card-soft p-6 md:p-8 flex flex-col gap-5">
                <h2 className="text-title-lg font-display font-extrabold text-on-surface flex items-center gap-2">
                  <Icon name="apparel" size={20} className="text-primary" />
                  Novo produto
                </h2>

                <Input label="Título" placeholder="Ex: Camiseta KITE360º Oversized - Preta" value={fTitle} onChange={(e) => setFTitle(e.target.value)} required />

                <Textarea label="Descrição" placeholder="Detalhes do produto, material, medidas, conservação..." value={fDescription} onChange={(e) => setFDescription(e.target.value)} rows={4} required />

                <div className="grid grid-cols-2 gap-4">
                  <Select label="Categoria" options={FASHION_CATEGORIES} value={fCategory} onChange={(e) => setFCategory(e.target.value)} />
                  <Select label="Condição" options={[{ value: 'new', label: 'Novo' }, { value: 'used', label: 'Usado' }]} value={fCondition} onChange={(e) => setFCondition(e.target.value as 'new' | 'used')} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input label="Marca" placeholder="Ex: KITE360º" value={fBrand} onChange={(e) => setFBrand(e.target.value)} />
                  <Input label="Tamanho" placeholder="Ex: M, G, 42" value={fSize} onChange={(e) => setFSize(e.target.value)} />
                  <Input label="Cor" placeholder="Ex: Preto" value={fColor} onChange={(e) => setFColor(e.target.value)} />
                </div>

                <Input label="Preço (R$)" type="number" min="0" step="0.01" placeholder="129,90" value={fPrice} onChange={(e) => setFPrice(e.target.value)} required />

                <div className="flex flex-col gap-3">
                  <label className="text-label-md font-display font-bold text-on-surface-variant uppercase tracking-wider">Fotos (até 8)</label>
                  <div className="grid grid-cols-4 gap-3">
                    {fPreviews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface-container-low group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute top-1 left-1 bg-primary text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded">Capa</span>}
                        <button type="button" onClick={() => removeFashionImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Icon name="delete" size={20} className="text-white" />
                        </button>
                      </div>
                    ))}
                    {fImages.length < 8 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-fixed transition-colors">
                        <Icon name="add_photo_alternate" size={24} className="text-outline mb-1" />
                        <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Adicionar</span>
                        <input type="file" accept="image/*" multiple onChange={handleFashionImages} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">Cancelar</Button>
                <Button type="submit" loading={fLoading} className="flex-1">Publicar produto</Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
