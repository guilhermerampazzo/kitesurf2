'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { StarRating } from '@/components/ui/StarRating'
import { kiteSchoolApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { Course, Lesson } from '@/types/escola'
import { formatDuration, youtubeEmbedUrl } from '@/types/escola'
import toast from 'react-hot-toast'
import DOMPurify from 'dompurify'

type DetailResponse = Course & {
  isEnrolled?: boolean
  hasFullAccess?: boolean
  enrollment?: { paymentStatus?: string } | null
}

export default function CursoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<DetailResponse | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selected, setSelected] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto' | 'free'>('pix')
  const [progressSaving, setProgressSaving] = useState<string | null>(null)
  const [showPaymentChoice, setShowPaymentChoice] = useState(false)
  const [isLogged, setIsLogged] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    try {
      const { data } = await kiteSchoolApi.getCourse(id)
      const c: DetailResponse = data
      setCourse(c)
      const ls: Lesson[] = c.lessons ?? []
      setLessons(ls)
      if (ls.length > 0) setSelected(ls[0])
    } catch {
      toast.error('Curso não encontrado.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { setIsLogged(!!localStorage.getItem('kite_access_token')) }, [])

  async function handleEnroll() {
    if (!course) return
    if (course.isFree) {
      setEnrolling(true)
      try {
        await kiteSchoolApi.enroll(course.id, { method: 'free' })
        toast.success('Matrícula realizada!')
        load()
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao se inscrever.'
        toast.error(msg)
      } finally { setEnrolling(false) }
      return
    }
    // Paid: if payment choice not open, open it
    if (!showPaymentChoice) {
      setShowPaymentChoice(true)
      return
    }
    setEnrolling(true)
    try {
      await kiteSchoolApi.enroll(course.id, { method: paymentMethod })
      toast.success('Matrícula realizada! Verifique o pagamento.')
      setShowPaymentChoice(false)
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao se inscrever.'
      toast.error(msg)
    } finally { setEnrolling(false) }
  }

  async function markProgress(lessonId: string) {
    setProgressSaving(lessonId)
    try {
      await kiteSchoolApi.lessonProgress(lessonId, { isCompleted: true, watchedSeconds: 0 })
      toast.success('Progresso salvo!')
    } catch {
      toast.error('Faça login e esteja matriculado para salvar progresso.')
    } finally {
      setProgressSaving(null)
    }
  }

  function canPlayLesson(lesson: Lesson, idx: number): boolean {
    if (!course) return false
    if (course.hasFullAccess || course.isEnrolled) return true
    // Preview / free / within freeLessons
    if (lesson.isPreview || lesson.isFree) return true
    if (course.freeLessons > 0 && idx < course.freeLessons) return true
    return false
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-unit-xl flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    )
  }

  if (!course) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-16 text-center">
          <Icon name="school" size={48} className="text-outline-variant mb-4" />
          <h1 className="text-headline-md font-display font-black text-on-surface">Curso não encontrado</h1>
          <Link href="/escola" className="inline-flex mt-6 text-primary font-bold hover:text-accent-strong gap-2 items-center">
            <Icon name="arrow_back" size={18} /> Voltar para a escola
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  const safeDesc = typeof window !== 'undefined'
    ? DOMPurify.sanitize(course.description, { ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li','h1','h2','h3','img','a'], ALLOWED_ATTR: ['src','alt','class','href','target','rel'] })
    : course.description

  const thumb = course.thumbnail ?? '/imagens/kitesurf.webp'
  const hasAccess = course.hasFullAccess || course.isEnrolled
  const isOwner = false // resolved on edit page; detail stays public

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop mb-unit-xl pt-2">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-unit-lg flex-wrap">
          <Link href="/" className="hover:text-primary">Home</Link>
          <Icon name="chevron_right" size={16} />
          <Link href="/escola" className="hover:text-primary">Escola</Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-on-surface truncate max-w-xs">{course.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-unit-xl">
          {/* Left: content */}
          <div className="flex-1 min-w-0">
            {/* Course header */}
            <div className="card-soft overflow-hidden mb-unit-xl">
              <div className="relative aspect-[16/9] bg-surface-container-low">
                <Image
                  src={thumb}
                  alt={course.title}
                  fill
                  className="object-cover"
                  priority
                  unoptimized={thumb.startsWith('/imagens') || thumb.startsWith('/uploads') || thumb.startsWith('http')}
                />
                <div className="absolute bottom-3 left-3 z-10 flex gap-2 flex-wrap">
                  <Badge variant={course.isFree ? 'success' : 'sponsored'}>
                    {course.isFree ? 'Gratuito' : formatPrice(course.price)}
                  </Badge>
                  <Badge variant="onphoto" className="capitalize">{course.level}</Badge>
                  {course.category && <Badge variant="onphoto">{course.category.name}</Badge>}
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-headline-md md:text-display-lg font-display font-black text-on-surface leading-tight">
                  {course.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 mt-4 text-body-md text-secondary">
                  {course.instructor && (
                    <Link href={`/vendedor/${course.instructor.id}`} className="flex items-center gap-2 group">
                      <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold text-sm overflow-hidden">
                        {course.instructor.avatar
                          ? <Image src={course.instructor.avatar} alt={course.instructor.name} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                          : course.instructor.name[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">{course.instructor.name}</span>
                      {course.instructor.isVerified && <Icon name="verified" filled size={14} className="text-primary" />}
                    </Link>
                  )}
                  <span className="hidden sm:inline text-outline-variant">·</span>
                  <span className="flex items-center gap-1"><Icon name="menu_book" size={16} /> {course.totalLessons || lessons.length} aulas</span>
                  <span className="hidden sm:inline text-outline-variant">·</span>
                  <span className="flex items-center gap-1"><Icon name="schedule" size={16} /> {formatDuration(course.totalDuration)}</span>
                  {course.rating > 0 && (
                    <>
                      <span className="hidden sm:inline text-outline-variant">·</span>
                      <span className="flex items-center gap-1.5">
                        <StarRating value={course.rating} size={14} />
                        <span className="font-semibold text-on-surface">{course.rating.toFixed(1)}</span>
                        <span className="text-secondary">({course.reviewCount})</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Enroll / manage — gated for logged users */}
                <div className="mt-6">
                  {!hasAccess ? (
                    isLogged === null ? (
                      <div className="h-12 w-48 bg-surface-container animate-pulse rounded-full" />
                    ) : isLogged ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <Button onClick={handleEnroll} variant="accent" loading={enrolling} className="shrink-0">
                          <Icon name={course.isFree ? 'how_to_reg' : 'shopping_cart'} size={18} />
                          {course.isFree ? 'Inscrever-se grátis' : showPaymentChoice ? 'Confirmar matrícula' : `Matricular — ${formatPrice(course.price)}`}
                        </Button>
                        {!course.isFree && showPaymentChoice && (
                          <div className="flex items-center gap-2">
                            {(['pix', 'card', 'boleto'] as const).map((m) => (
                              <button
                                key={m}
                                onClick={() => setPaymentMethod(m)}
                                className={`px-3 py-1.5 rounded-full text-body-md font-semibold border transition-colors capitalize ${paymentMethod === m ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant hover:border-primary'}`}
                              >
                                {m}
                              </button>
                            ))}
                            <button onClick={() => setShowPaymentChoice(false)} className="text-body-md text-secondary hover:text-primary ml-2">cancelar</button>
                          </div>
                        )}
                        <span className="text-body-md text-secondary flex items-center gap-1">
                          <Icon name="lock_open" size={14} />
                          {course.freeLessons > 0 ? `${course.freeLessons} aula(s) grátis` : lessons.filter((l) => l.isPreview || l.isFree).length > 0 ? 'Aulas preview disponíveis' : 'Acesso completo após matrícula'}
                        </span>
                      </div>
                    ) : (
                      <div className="card-soft p-6 bg-brand-gradient text-white">
                        <p className="font-display font-black text-white">Faça login para se matricular</p>
                        <p className="text-white/80 text-body-md mt-1">Crie sua conta grátis e tenha acesso completo a todas as aulas deste curso.</p>
                        <div className="flex gap-3 mt-4 flex-wrap">
                          <Link href="/login" className="bg-white text-primary px-5 py-2 rounded-full font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5"><Icon name="login" size={16} /> Entrar</Link>
                          <Link href="/cadastro" className="btn-accent px-5 py-2 rounded-full font-bold inline-flex items-center gap-1.5">Criar conta</Link>
                        </div>
                      </div>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-body-md font-bold">
                      <Icon name="check_circle" filled size={18} /> Você está matriculado
                    </span>
                  )}
                  <Link href={`/escola/curso/${course.id}/editar`} className="mt-3 inline-flex items-center gap-2 text-body-md font-bold text-secondary hover:text-primary transition-colors">
                    <Icon name="edit" size={16} /> Editar curso
                  </Link>
                </div>
              </div>
            </div>

            {/* Video player */}
            <div className="card-soft overflow-hidden mb-unit-xl">
              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
                <h2 className="text-title-lg font-display font-extrabold text-on-surface flex items-center gap-2">
                  <Icon name="play_circle" size={20} className="text-primary" />
                  {selected ? selected.title : 'Selecione uma aula'}
                </h2>
                {selected && (
                  <span className="text-body-md text-secondary flex items-center gap-1">
                    <Icon name="schedule" size={14} /> {formatDuration(selected.duration)}
                  </span>
                )}
              </div>

              <div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden">
                {!selected ? (
                  <div className="text-white/70 flex flex-col items-center gap-2 py-16">
                    <Icon name="video_library" size={40} />
                    <span className="text-body-md">Nenhuma aula selecionada</span>
                  </div>
                ) : (() => {
                  const idx = lessons.findIndex((l) => l.id === selected.id)
                  const locked = !canPlayLesson(selected, idx)
                  if (locked) {
                    return (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-gradient-to-br from-[#001e40] to-[#1f477b]">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                          <Icon name="lock" size={32} className="text-accent" />
                        </div>
                        <div>
                          <div className="text-white font-display font-extrabold text-lg">Conteúdo bloqueado</div>
                          <p className="text-white/70 text-body-md mt-1 max-w-sm">Matricule-se para desbloquear esta aula e todo o conteúdo do curso.</p>
                        </div>
                        {!hasAccess && (
                          isLogged ? (
                            <Button onClick={handleEnroll} variant="accent" size="sm" loading={enrolling}>
                              <Icon name="lock_open" size={16} />
                              {course.isFree ? 'Inscrever grátis' : `Matricular — ${formatPrice(course.price)}`}
                            </Button>
                          ) : isLogged === false ? (
                            <div className="flex gap-2">
                              <Link href="/login" className="bg-white text-primary px-5 py-2 rounded-full font-bold text-body-md">Entrar para desbloquear</Link>
                              <Link href="/cadastro" className="btn-accent px-5 py-2 rounded-full font-bold text-body-md">Criar conta</Link>
                            </div>
                          ) : null
                        )}
                      </div>
                    )
                  }
                  // Playable: youtube vs upload
                  const isYoutube = selected.videoType === 'youtube'
                  if (isYoutube) {
                    const embed = youtubeEmbedUrl(selected.youtubeId ?? selected.videoUrl ?? '')
                    if (embed) {
                      return (
                        <iframe
                          src={embed}
                          title={selected.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )
                    }
                    return (
                      <div className="text-white/70 flex flex-col items-center gap-2 p-8 text-center">
                        <Icon name="error" size={32} />
                        <span className="text-body-md">Vídeo do YouTube indisponível.</span>
                      </div>
                    )
                  }
                  // upload
                  if (selected.videoUrl) {
                    return (
                      <video
                        key={selected.id}
                        src={selected.videoUrl}
                        controls
                        className="w-full h-full object-contain bg-black"
                        onEnded={() => {
                          // auto mark? we keep manual button
                        }}
                      />
                    )
                  }
                  return (
                    <div className="text-white/70 flex flex-col items-center gap-2 p-8 text-center">
                      <Icon name="videocam_off" size={32} />
                      <span className="text-body-md">Vídeo ainda não disponível para esta aula.</span>
                    </div>
                  )
                })()}
              </div>

              {selected && (
                <div className="p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-title-lg font-bold text-on-surface">{selected.title}</h3>
                    {selected.description && (
                      <p className="text-body-md text-on-surface-variant mt-2 whitespace-pre-wrap">{selected.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => markProgress(selected.id)}
                      loading={progressSaving === selected.id}
                    >
                      <Icon name="check_circle" size={16} />
                      Marcar como concluída
                    </Button>
                    <span className="text-body-md text-secondary flex items-center gap-1">
                      {selected.isPreview && <><Icon name="visibility" size={14} /> Preview</>}
                      {selected.isPreview && selected.isFree ? ' · ' : ''}
                      {selected.isFree && <><Icon name="verified" size={14} /> Gratuita</>}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="card-soft p-6">
              <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-4 section-rule inline-block">Sobre o curso</h2>
              <div
                className="text-body-lg text-on-surface-variant leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: safeDesc }}
              />
            </div>
          </div>

          {/* Right: lessons list */}
          <aside className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-unit-md">
              <div className="card-soft overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
                  <h2 className="text-title-lg font-display font-extrabold text-on-surface">Conteúdo</h2>
                  <span className="text-body-md text-secondary">{lessons.length} aulas</span>
                </div>

                {lessons.length === 0 ? (
                  <div className="p-8 text-center text-secondary">
                    <Icon name="menu_book" size={32} className="text-outline-variant mb-2" />
                    <p className="text-body-md">Nenhuma aula cadastrada ainda.</p>
                    <Link href={`/escola/curso/${course.id}/editar`} className="text-primary font-bold hover:text-accent-strong text-body-md mt-2 inline-block">Gerenciar aulas</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant max-h-[60vh] overflow-y-auto">
                    {lessons.map((lesson, idx) => {
                      const locked = !canPlayLesson(lesson, idx)
                      const isActive = selected?.id === lesson.id
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setSelected(lesson)}
                          className={`w-full text-left flex items-start gap-3 px-5 py-4 hover:bg-surface-container transition-colors ${isActive ? 'bg-primary-fixed/60' : ''}`}
                        >
                          <span className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${locked ? 'bg-surface-container text-outline' : isActive ? 'bg-primary text-on-primary' : 'bg-primary-fixed text-on-primary-fixed-variant'}`}>
                            <Icon name={locked ? 'lock' : isActive ? 'play_arrow' : 'play_circle'} size={18} filled={isActive && !locked} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-body-md font-semibold leading-snug line-clamp-2 ${isActive ? 'text-primary' : locked ? 'text-secondary' : 'text-on-surface'}`}>
                              <span className="text-label-md text-outline mr-2">{String(idx + 1).padStart(2, '0')}</span>
                              {lesson.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {lesson.isPreview && <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-soft text-on-tertiary-fixed px-2 py-0.5 rounded-full">Preview</span>}
                              {lesson.isFree && !lesson.isPreview && <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Grátis</span>}
                              {locked && <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container border border-outline-variant text-secondary px-2 py-0.5 rounded-full flex items-center gap-1"><Icon name="lock" size={10} /> Bloqueada</span>}
                              <span className="text-label-md text-secondary flex items-center gap-1">
                                <Icon name="schedule" size={10} /> {formatDuration(lesson.duration)}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Summary card */}
              <div className="card-soft p-6">
                <h3 className="text-label-md uppercase tracking-wider font-display font-bold text-on-surface-variant mb-4">Este curso inclui</h3>
                <div className="flex flex-col gap-3 text-body-md text-on-surface-variant">
                  <span className="flex items-center gap-2"><Icon name="menu_book" size={18} className="text-primary" /> {lessons.length} aulas</span>
                  <span className="flex items-center gap-2"><Icon name="schedule" size={18} className="text-primary" /> {formatDuration(course.totalDuration)} de vídeo</span>
                  <span className="flex items-center gap-2"><Icon name="workspace_premium" size={18} className="text-primary" /> Acesso vitalício</span>
                  <span className="flex items-center gap-2"><Icon name="verified" size={18} className="text-primary" /> Certificado de conclusão</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
