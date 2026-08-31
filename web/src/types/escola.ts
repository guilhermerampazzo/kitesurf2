export interface CourseCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  _count?: { courses: number }
  createdAt?: string
}

export interface InstructorLite {
  id: string
  name: string
  avatar?: string | null
  isVerified?: boolean
  rating?: number
  reviewCount?: number
}

export interface Lesson {
  id: string
  courseId: string
  title: string
  description?: string | null
  videoUrl?: string | null
  videoType: 'upload' | 'youtube'
  youtubeId?: string | null
  duration?: number | null
  order: number
  isPreview: boolean
  isFree: boolean
  createdAt?: string
  updatedAt?: string
  progress?: { isCompleted: boolean; watchedSeconds: number } | null
}

export interface Course {
  id: string
  title: string
  description: string
  categoryId: string
  category?: CourseCategory | null
  instructorId: string
  instructor?: InstructorLite | null
  thumbnail?: string | null
  price: number
  isFree: boolean
  freeLessons: number
  level: string
  language: string
  status: string
  totalDuration: number
  totalLessons: number
  enrollCount: number
  rating: number
  reviewCount: number
  lessons?: Lesson[]
  _count?: { lessons: number; enrollments?: number }
  isEnrolled?: boolean
  hasFullAccess?: boolean
  enrollment?: Enrollment | null
  createdAt: string
  updatedAt: string
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  progress: number
  completedLessons: number
  paymentStatus: string
  amountPaid: number
  commissionAmount: number
  paymentId?: string | null
  createdAt: string
  updatedAt: string
  course?: Course | null
}

export type CourseLevel = 'iniciante' | 'intermediario' | 'avancado'

export const COURSE_LEVELS: { value: CourseLevel; label: string }[] = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
]

export const COURSE_LEVEL_OPTIONS = COURSE_LEVELS.map((l) => ({ value: l.value, label: l.label }))

export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}min`
}

export function youtubeEmbedUrl(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return `https://www.youtube.com/embed/${trimmed}`
  try {
    const url = new URL(trimmed)
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.slice(1).split('/')[0]
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
      const parts = url.pathname.split('/').filter(Boolean)
      const embedIdx = parts.indexOf('embed')
      if (embedIdx !== -1 && parts[embedIdx + 1]) return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`
      const shortsIdx = parts.indexOf('shorts')
      if (shortsIdx !== -1 && parts[shortsIdx + 1]) return `https://www.youtube.com/embed/${parts[shortsIdx + 1]}`
    }
  } catch {
    // fallback
  }
  const m = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (m?.[1]) return `https://www.youtube.com/embed/${m[1]}`
  return null
}
