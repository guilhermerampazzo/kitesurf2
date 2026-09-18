import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common'
import { PrismaService } from '../prisma.module'
import { CommissionService } from '../commission/commission.service'
import { AsaasService } from '../asaas/asaas.service'
import { extractYoutubeId, isValidVideoType } from './utils/youtube.util'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

@Injectable()
export class KiteSchoolService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    private asaasService: AsaasService,
  ) {}

  // Default categories, seeded idempotently on boot so course creation
  // never breaks on fresh/prod databases without manual seeding.
  async onModuleInit() {
    const defaults = [
      { name: 'Kitesurf', slug: 'kitesurf', description: 'Cursos de kitesurf do básico ao avançado' },
      { name: 'Wingfoil', slug: 'wingfoil', description: 'Cursos de wingfoil do básico ao avançado' },
      { name: 'Kitefoil', slug: 'kitefoil', description: 'Cursos de kitefoil e hydrofoil' },
      { name: 'Kitewave', slug: 'kitewave', description: 'Cursos de kitewave e surf com kite' },
    ]
    for (const c of defaults) {
      await this.prisma.courseCategory.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      }).catch(() => null)
    }
  }

  // ── Categories ────────────────────────────────────────────────────────────

  async findAllCategories() {
    return this.prisma.courseCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { courses: true } } },
    })
  }

  async findOneCategory(idOrSlug: string) {
    const cat = await this.prisma.courseCategory.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { _count: { select: { courses: true } } },
    })
    if (!cat) throw new NotFoundException('Categoria não encontrada.')
    return cat
  }

  async createCategory(data: {
    name: string
    slug?: string
    description?: string
    icon?: string
  }) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name)
    // check duplicates
    const existing = await this.prisma.courseCategory.findFirst({
      where: { OR: [{ name: data.name }, { slug }] },
    })
    if (existing) throw new ConflictException('Categoria com mesmo nome ou slug já existe.')

    return this.prisma.courseCategory.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        icon: data.icon,
      },
    })
  }

  async updateCategory(
    id: string,
    data: { name?: string; slug?: string; description?: string; icon?: string },
  ) {
    const cat = await this.prisma.courseCategory.findUnique({ where: { id } })
    if (!cat) throw new NotFoundException('Categoria não encontrada.')

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.slug !== undefined) updateData.slug = slugify(data.slug)
    else if (data.name !== undefined) {
      // optionally auto-update slug if name changed and no slug provided? keep original slug to avoid breaking
    }
    if (data.description !== undefined) updateData.description = data.description
    if (data.icon !== undefined) updateData.icon = data.icon

    // check slug/name conflict with other categories
    if (updateData.slug || updateData.name) {
      const conflict = await this.prisma.courseCategory.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(updateData.name ? [{ name: updateData.name as string }] : []),
            ...(updateData.slug ? [{ slug: updateData.slug as string }] : []),
          ],
        },
      })
      if (conflict) throw new ConflictException('Outra categoria já usa esse nome ou slug.')
    }

    return this.prisma.courseCategory.update({ where: { id }, data: updateData })
  }

  async deleteCategory(id: string) {
    const cat = await this.prisma.courseCategory.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    })
    if (!cat) throw new NotFoundException('Categoria não encontrada.')
    if (cat._count.courses > 0)
      throw new BadRequestException('Não é possível deletar categoria com cursos vinculados.')
    return this.prisma.courseCategory.delete({ where: { id } })
  }

  // ── Courses ───────────────────────────────────────────────────────────────

  async findAllCourses(params: {
    q?: string
    category?: string
    level?: string
    isFree?: boolean
    instructorId?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 20, 50)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    // default status = active for public; if caller passes status explicitly use it
    if (params.status) {
      if (params.status !== 'all') (where as any).status = params.status
    } else {
      ;(where as any).status = 'active'
    }

    if (params.q) {
      ;(where as any).OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.category) {
      // try to match by id or slug
      const cat = await this.prisma.courseCategory.findFirst({
        where: { OR: [{ id: params.category }, { slug: params.category }] },
        select: { id: true },
      })
      if (cat) (where as any).categoryId = cat.id
      else {
        // if category not found, filter by category relation slug (fallback)
        // to return empty correctly we set impossible id
        ;(where as any).categoryId = '__notfound__'
      }
    }

    if (params.level) (where as any).level = params.level
    if (params.isFree !== undefined) (where as any).isFree = params.isFree
    if (params.instructorId) (where as any).instructorId = params.instructorId

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          category: true,
          instructor: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isVerified: true,
              rating: true,
              reviewCount: true,
            },
          },
          _count: { select: { lessons: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async adminListCourses(params: {
    q?: string
    category?: string
    level?: string
    isFree?: boolean
    instructorId?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 20, 50)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (params.q) {
      ;(where as any).OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.status && params.status !== 'all') (where as any).status = params.status
    if (params.category) {
      const cat = await this.prisma.courseCategory.findFirst({
        where: { OR: [{ id: params.category }, { slug: params.category }] },
        select: { id: true },
      })
      if (cat) (where as any).categoryId = cat.id
      else (where as any).categoryId = '__notfound__'
    }
    if (params.level) (where as any).level = params.level
    if (params.isFree !== undefined) (where as any).isFree = params.isFree
    if (params.instructorId) (where as any).instructorId = params.instructorId

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          category: true,
          instructor: {
            select: { id: true, name: true, avatar: true, isVerified: true },
          },
          _count: { select: { lessons: true, enrollments: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOneCourse(id: string, requestingUserId?: string, isAdmin = false) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
            rating: true,
            reviewCount: true,
          },
        },
        lessons: { orderBy: { order: 'asc' } },
        _count: { select: { lessons: true } },
      },
    })
    if (!course) throw new NotFoundException('Curso não encontrado.')

    // increment view? Not required

    // Determine access: instructor, admin, or enrolled with paid/free status
    let hasFullAccess = false
    let isEnrolled = false
    let enrollment: any = null

    if (requestingUserId) {
      if (isAdmin || course.instructorId === requestingUserId) {
        hasFullAccess = true
      } else {
        enrollment = await this.prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: requestingUserId, courseId: id } },
        })
        if (enrollment) {
          isEnrolled = true
          // only paid/free allow full access; pending should restrict to preview/freeLessons
          if (['paid', 'free'].includes(enrollment.paymentStatus)) hasFullAccess = true
        }
      }
    }

    // For non-full access, hide video URLs for non-preview lessons beyond freeLessons
    let lessons = course.lessons
    if (!hasFullAccess) {
      lessons = lessons.map((l, idx) => {
        const isWithinFreeLessons = course.freeLessons > 0 && idx < course.freeLessons
        const isFreeAccess = l.isPreview || l.isFree || isWithinFreeLessons
        if (isFreeAccess) return l
        // hide video data
        return {
          ...l,
          videoUrl: null,
          youtubeId: null,
        }
      })
    }

    return {
      ...course,
      lessons,
      isEnrolled,
      hasFullAccess,
      enrollment,
    }
  }

  async createCourse(
    userId: string,
    data: {
      title: string
      description: string
      categoryId: string
      thumbnail?: string
      price?: number
      isFree?: boolean
      freeLessons?: number
      level?: string
      language?: string
      status?: string
      commissionRate?: number
    },
  ) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { id: data.categoryId },
    })
    if (!category) {
      // try slug
      const bySlug = await this.prisma.courseCategory.findUnique({
        where: { slug: data.categoryId },
      })
      if (!bySlug) throw new NotFoundException('Categoria não encontrada.')
      data.categoryId = bySlug.id
    }

    const isFree = data.isFree ?? true
    const price = isFree ? 0 : (data.price ?? 0)

    if (!isFree && price <= 0)
      throw new BadRequestException('Cursos pagos devem ter preço maior que zero.')

    if (data.commissionRate !== undefined && (data.commissionRate < 0 || data.commissionRate > 100))
      throw new BadRequestException('commissionRate deve estar entre 0 e 100.')

    return this.prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        instructorId: userId,
        thumbnail: data.thumbnail,
        price,
        isFree,
        freeLessons: data.freeLessons ?? 0,
        level: data.level ?? 'iniciante',
        language: data.language ?? 'pt-BR',
        status: data.status ?? 'active',
        commissionRate: data.commissionRate,
        totalLessons: 0,
        totalDuration: 0,
      },
      include: { category: true, instructor: { select: { id: true, name: true, avatar: true } } },
    })
  }

  async updateCourse(
    id: string,
    userId: string,
    isAdmin: boolean,
    data: Partial<{
      title: string
      description: string
      categoryId: string
      thumbnail: string
      price: number
      isFree: boolean
      freeLessons: number
      level: string
      language: string
      status: string
      commissionRate: number
    }>,
  ) {
    const course = await this.prisma.course.findUnique({ where: { id } })
    if (!course) throw new NotFoundException('Curso não encontrado.')
    if (course.instructorId !== userId && !isAdmin) throw new ForbiddenException()

    // if non-admin tries to change status to something beyond active/draft? allow but admin can moderate separately
    // category validation
    if (data.categoryId) {
      const cat = await this.prisma.courseCategory.findFirst({
        where: { OR: [{ id: data.categoryId }, { slug: data.categoryId }] },
        select: { id: true },
      })
      if (!cat) throw new NotFoundException('Categoria não encontrada.')
      data.categoryId = cat.id
    }

    if (data.commissionRate !== undefined) {
      if (data.commissionRate < 0 || data.commissionRate > 100)
        throw new BadRequestException('commissionRate deve estar entre 0 e 100.')
      // only admin can set commissionRate? allow instructor but clamp; spec says Course.commissionRate can override
    }

    // handle pricing logic
    const updateData: Record<string, unknown> = { ...data }

    // if isFree is being updated
    if (data.isFree !== undefined) {
      if (data.isFree) {
        updateData.price = 0
      } else {
        // becoming paid: price must be >0
        const newPrice = data.price ?? course.price
        if (!newPrice || newPrice <= 0)
          throw new BadRequestException('Cursos pagos devem ter preço maior que zero.')
        updateData.price = newPrice
      }
    } else if (data.price !== undefined) {
      // price update without isFree change; if course is free, keep 0 unless isFree false
      if (course.isFree && data.price > 0)
        throw new BadRequestException('Curso gratuito não pode ter preço. Defina isFree=false.')
      if (!course.isFree && data.price <= 0)
        throw new BadRequestException('Preço deve ser maior que zero para curso pago.')
    }

    // Non-admin cannot set commissionRate? allow but if needed guard: we already allow
    // Non-admin cannot directly set status to moderation? let pass

    return this.prisma.course.update({ where: { id }, data: updateData })
  }

  async deleteCourse(id: string, userId: string, isAdmin: boolean) {
    const course = await this.prisma.course.findUnique({ where: { id } })
    if (!course) throw new NotFoundException('Curso não encontrado.')
    if (course.instructorId !== userId && !isAdmin) throw new ForbiddenException()

    return this.prisma.course.delete({ where: { id } })
  }

  async moderateCourse(id: string, status: string) {
    const allowed = ['draft', 'active', 'archived', 'moderation']
    if (!allowed.includes(status)) throw new BadRequestException(`Status inválido. Permitidos: ${allowed.join(', ')}`)
    const course = await this.prisma.course.findUnique({ where: { id } })
    if (!course) throw new NotFoundException('Curso não encontrado.')
    return this.prisma.course.update({ where: { id }, data: { status } })
  }

  // ── Lessons ────────────────────────────────────────────────────────────────

  private async recalcCourseStats(courseId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      select: { duration: true },
    })
    const totalLessons = lessons.length
    const totalDuration = lessons.reduce((acc, l) => acc + (l.duration ?? 0), 0)

    await this.prisma.course.update({
      where: { id: courseId },
      data: { totalLessons, totalDuration },
    })

    return { totalLessons, totalDuration }
  }

  async createLesson(
    courseId: string,
    userId: string,
    isAdmin: boolean,
    data: {
      title: string
      description?: string
      videoType?: string
      youtubeUrl?: string
      videoUrl?: string
      youtubeId?: string
      duration?: number
      order?: number
      isPreview?: boolean
      isFree?: boolean
    },
  ) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Curso não encontrado.')
    if (course.instructorId !== userId && !isAdmin) throw new ForbiddenException('Apenas o instrutor pode adicionar aulas.')

    const videoType = data.videoType ?? (data.youtubeUrl ? 'youtube' : 'upload')
    if (!isValidVideoType(videoType)) throw new BadRequestException('videoType deve ser upload ou youtube.')

    let videoUrl: string | null = data.videoUrl ?? null
    let youtubeId: string | null = data.youtubeId ?? null

    if (videoType === 'youtube') {
      const source = data.youtubeUrl ?? data.videoUrl ?? youtubeId ?? ''
      if (!source) throw new BadRequestException('youtubeUrl é obrigatório para videoType youtube.')
      const extracted = extractYoutubeId(source)
      if (!extracted) throw new BadRequestException('URL do YouTube inválida. Suporte: youtube.com/watch?v=, youtu.be/, /embed/, /shorts/')
      youtubeId = extracted
      videoUrl = data.youtubeUrl ?? `https://www.youtube.com/watch?v=${extracted}`
    } else {
      // upload: videoUrl should already be provided by controller after saving file
      // if both youtubeUrl and videoUrl missing, allow creating without video (draft)
      if (data.youtubeUrl && !videoUrl) {
        // if mistakenly sent youtubeUrl with upload type, error
        throw new BadRequestException('videoType upload não aceita youtubeUrl. Use youtube.')
      }
    }

    let order = data.order
    if (order === undefined || order === null) {
      const max = await this.prisma.lesson.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      order = max ? max.order + 1 : 0
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        videoUrl,
        videoType,
        youtubeId,
        duration: data.duration,
        order,
        isPreview: data.isPreview ?? false,
        isFree: data.isFree ?? false,
      },
    })

    await this.recalcCourseStats(courseId)

    return lesson
  }

  async updateLesson(
    lessonId: string,
    userId: string,
    isAdmin: boolean,
    data: {
      title?: string
      description?: string
      videoType?: string
      youtubeUrl?: string
      videoUrl?: string
      youtubeId?: string
      duration?: number
      order?: number
      isPreview?: boolean
      isFree?: boolean
    },
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    })
    if (!lesson) throw new NotFoundException('Aula não encontrada.')
    if (lesson.course.instructorId !== userId && !isAdmin) throw new ForbiddenException()

    const updateData: Record<string, unknown> = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.order !== undefined) updateData.order = data.order
    if (data.isPreview !== undefined) updateData.isPreview = data.isPreview
    if (data.isFree !== undefined) updateData.isFree = data.isFree

    // video handling
    if (data.videoType !== undefined || data.youtubeUrl !== undefined || data.videoUrl !== undefined) {
      const newType = (data.videoType ?? lesson.videoType) as string
      if (!isValidVideoType(newType)) throw new BadRequestException('videoType deve ser upload ou youtube.')

      updateData.videoType = newType

      if (newType === 'youtube') {
        const source = data.youtubeUrl ?? data.videoUrl ?? data.youtubeId ?? lesson.youtubeId ?? lesson.videoUrl ?? ''
        if (data.youtubeUrl) {
          const extracted = extractYoutubeId(data.youtubeUrl)
          if (!extracted) throw new BadRequestException('URL do YouTube inválida.')
          updateData.youtubeId = extracted
          updateData.videoUrl = data.youtubeUrl
        } else if (data.videoUrl) {
          const extracted = extractYoutubeId(data.videoUrl)
          if (extracted) {
            updateData.youtubeId = extracted
            updateData.videoUrl = data.videoUrl
          } else {
            throw new BadRequestException('youtubeUrl é obrigatório para videoType youtube.')
          }
        } else if (lesson.youtubeId) {
          // keep existing
          updateData.youtubeId = lesson.youtubeId
          updateData.videoUrl = lesson.videoUrl
        } else {
          throw new BadRequestException('youtubeUrl é obrigatório para videoType youtube.')
        }
      } else {
        // upload
        if (data.videoUrl !== undefined) {
          updateData.videoUrl = data.videoUrl
          updateData.youtubeId = null
        } else if (data.youtubeUrl) {
          throw new BadRequestException('videoType upload não aceita youtubeUrl.')
        }
        // if no videoUrl provided, keep existing youtubeId cleared? keep as is if switching from youtube to upload without new file: clear youtubeId
        if (lesson.videoType === 'youtube' && newType === 'upload' && data.videoUrl === undefined) {
          updateData.youtubeId = null
          // keep videoUrl if exists? but youtube url not valid for upload; clear if it was youtube link
          if (lesson.videoUrl?.includes('youtube') || lesson.videoUrl?.includes('youtu.be')) {
            updateData.videoUrl = null
          }
        }
      }
    }

    const updated = await this.prisma.lesson.update({ where: { id: lessonId }, data: updateData })

    if (data.duration !== undefined || data.order !== undefined) {
      await this.recalcCourseStats(lesson.courseId)
    } else if (updateData.duration !== undefined) {
      await this.recalcCourseStats(lesson.courseId)
    }

    // also recalc if needed when video changed? not needed for stats but keep

    return updated
  }

  async deleteLesson(lessonId: string, userId: string, isAdmin: boolean) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    })
    if (!lesson) throw new NotFoundException('Aula não encontrada.')
    if (lesson.course.instructorId !== userId && !isAdmin) throw new ForbiddenException()

    await this.prisma.lesson.delete({ where: { id: lessonId } })
    await this.recalcCourseStats(lesson.courseId)

    // also need to handle ordering? keep gaps

    return { deleted: true }
  }

  async listLessons(courseId: string, requestingUserId?: string, isAdmin = false) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Curso não encontrado.')

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    })

    // hide video for not enrolled as in findOne
    let hasFullAccess = false
    if (requestingUserId) {
      if (isAdmin || course.instructorId === requestingUserId) hasFullAccess = true
      else {
        const enrollment = await this.prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: requestingUserId, courseId } },
        })
        if (enrollment && ['paid', 'free'].includes(enrollment.paymentStatus)) hasFullAccess = true
      }
    }

    if (hasFullAccess) return lessons

    return lessons.map((l, idx) => {
      const isWithinFreeLessons = course.freeLessons > 0 && idx < course.freeLessons
      const isFreeAccess = l.isPreview || l.isFree || isWithinFreeLessons
      if (isFreeAccess) return l
      return { ...l, videoUrl: null, youtubeId: null }
    })
  }

  // ── Enrollments ────────────────────────────────────────────────────────────

  async enroll(userId: string, courseId: string, method?: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Curso não encontrado.')
    if (course.status !== 'active')
      throw new BadRequestException('Curso não está ativo para matrícula.')

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (existing) throw new ConflictException('Você já está matriculado neste curso.')

    // Free course: direct enrollment
    if (course.isFree) {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          userId,
          courseId,
          progress: 0,
          completedLessons: 0,
          paymentStatus: 'free',
          amountPaid: 0,
          commissionAmount: 0,
        },
      })
      await this.prisma.course.update({
        where: { id: courseId },
        data: { enrollCount: { increment: 1 } },
      })
      return { enrollment, payment: null }
    }

    // Paid course
    const rate = course.commissionRate ?? (await this.commissionService.getRate('kite_school'))
    const commissionAmount = Number(((course.price * rate) / 100).toFixed(2))

    // Create payment via AsaasService
    const paymentMethod = method ?? 'pix'
    if (!['pix', 'card', 'free', 'boleto'].includes(paymentMethod))
      throw new BadRequestException('method deve ser pix, card, boleto ou free')

    const payment = await this.asaasService.createPayment({
      userId,
      module: 'kite_school',
      referenceId: courseId,
      amount: course.price,
      method: paymentMethod,
    })

    const paymentStatus = payment.status === 'paid' ? 'paid' : 'pending'

    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        progress: 0,
        completedLessons: 0,
        paymentStatus,
        amountPaid: course.price,
        commissionAmount,
        paymentId: payment.id,
      },
    })

    await this.prisma.course.update({
      where: { id: courseId },
      data: { enrollCount: { increment: 1 } },
    })

    return { enrollment, payment }
  }

  async getMyEnrollments(userId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            include: {
              category: true,
              instructor: { select: { id: true, name: true, avatar: true } },
              _count: { select: { lessons: true } },
            },
          },
        },
      }),
      this.prisma.enrollment.count({ where: { userId } }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getProgress(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Curso não encontrado.')

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (!enrollment) throw new NotFoundException('Matrícula não encontrada. Faça a matrícula primeiro.')

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    })

    const lessonIds = lessons.map((l) => l.id)
    const progresses = await this.prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
    })

    const progressMap = new Map(progresses.map((p) => [p.lessonId, p]))

    const lessonsWithProgress = lessons.map((l) => ({
      ...l,
      progress: progressMap.get(l.id) ?? null,
    }))

    return {
      enrollment,
      course: {
        id: course.id,
        title: course.title,
        totalLessons: course.totalLessons,
        totalDuration: course.totalDuration,
      },
      lessons: lessonsWithProgress,
    }
  }

  async updateLessonProgress(
    userId: string,
    lessonId: string,
    data: { watchedSeconds?: number; isCompleted?: boolean },
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    })
    if (!lesson) throw new NotFoundException('Aula não encontrada.')

    const courseId = lesson.courseId

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (!enrollment) throw new ForbiddenException('Você precisa estar matriculado para atualizar progresso.')

    if (!['paid', 'free'].includes(enrollment.paymentStatus)) {
      // if pending payment, only allow preview/free lessons
      const lessonsOrdered = await this.prisma.lesson.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
        select: { id: true, isPreview: true, isFree: true, order: true },
      })
      const idx = lessonsOrdered.findIndex((l) => l.id === lessonId)
      const current = lessonsOrdered[idx]
      const isWithinFreeLessons = lesson.course.freeLessons > 0 && idx < lesson.course.freeLessons
      const isFreeAccess = current.isPreview || current.isFree || isWithinFreeLessons
      if (!isFreeAccess) throw new ForbiddenException('Pagamento pendente. Apenas aulas gratuitas/preview disponíveis.')
    }

    // Validate watchedSeconds not negative
    if (data.watchedSeconds !== undefined && data.watchedSeconds < 0)
      throw new BadRequestException('watchedSeconds deve ser >= 0')

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })

    let progress: any

    if (existing) {
      progress = await this.prisma.lessonProgress.update({
        where: { id: existing.id },
        data: {
          watchedSeconds: data.watchedSeconds ?? existing.watchedSeconds,
          isCompleted: data.isCompleted ?? existing.isCompleted,
        },
      })
    } else {
      progress = await this.prisma.lessonProgress.create({
        data: {
          userId,
          lessonId,
          watchedSeconds: data.watchedSeconds ?? 0,
          isCompleted: data.isCompleted ?? false,
        },
      })
    }

    // Recalc Enrollment progress
    const allLessonIds = (
      await this.prisma.lesson.findMany({ where: { courseId }, select: { id: true } })
    ).map((l) => l.id)

    const completedCount = await this.prisma.lessonProgress.count({
      where: { userId, lessonId: { in: allLessonIds }, isCompleted: true },
    })

    const totalLessons = allLessonIds.length
    const newProgress = totalLessons > 0 ? Number(((completedCount / totalLessons) * 100).toFixed(2)) : 0

    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { completedLessons: completedCount, progress: newProgress },
    })

    // Optionally update course enroll progress? not needed

    return { progress, enrollment: updatedEnrollment }
  }

  async refund(userId: string, enrollmentIdOrCourseId: string) {
    // try to find by enrollment id first, fallback to courseId+userId
    let enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentIdOrCourseId, userId },
      include: { course: true },
    })

    if (!enrollment) {
      enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: enrollmentIdOrCourseId } },
        include: { course: true } as any,
      }) as any
      // Prisma unique with include needs special; workaround: fetch again
      if (enrollment) {
        // already got
      } else {
        // try findFirst courseId
        enrollment = await this.prisma.enrollment.findFirst({
          where: { userId, courseId: enrollmentIdOrCourseId },
          include: { course: true },
        })
      }
    }

    if (!enrollment) throw new NotFoundException('Matrícula não encontrada.')
    if (enrollment.paymentStatus === 'refunded')
      throw new BadRequestException('Matrícula já reembolsada.')
    if (enrollment.paymentStatus === 'free')
      throw new BadRequestException('Cursos gratuitos não podem ser reembolsados.')

    // 7 days policy
    const now = new Date()
    const created = new Date(enrollment.createdAt)
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays > 7) throw new BadRequestException('Prazo de reembolso expirado (7 dias).')

    if (enrollment.progress >= 30)
      throw new BadRequestException('Reembolso permitido apenas se progresso < 30%.')

    // call Asaas refund if paymentId exists
    if (enrollment.paymentId) {
      try {
        await this.asaasService.refundPayment(enrollment.paymentId)
      } catch {
        // if payment not found, continue
      }
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { paymentStatus: 'refunded' },
    })

    return updated
  }
}
