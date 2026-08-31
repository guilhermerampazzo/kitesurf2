import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma.module'
import { ContactFilterService } from '../chat/contact-filter.service'

const ALLOWED_CATEGORIES = ['moda', 'kite_style', 'tendencia', 'entrevista']
const ALLOWED_STATUSES = ['draft', 'published', 'archived']

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .substring(0, 80)
    .replace(/-+$/, '')
}

@Injectable()
export class BlogService {
  constructor(
    private prisma: PrismaService,
    private contactFilter: ContactFilterService,
  ) {}

  private async generateUniqueSlug(title: string, slugInput?: string, excludeId?: string): Promise<string> {
    let base = slugInput ? slugify(slugInput) : slugify(title)
    if (!base) base = 'post'
    let slug = base
    let counter = 2
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.blogPost.findUnique({ where: { slug } })
      if (!existing) break
      if (excludeId && existing.id === excludeId) break
      slug = `${base}-${counter}`
      counter++
      if (counter > 100) throw new BadRequestException('Não foi possível gerar slug único.')
    }
    return slug
  }

  async findAll(params: {
    q?: string
    category?: string
    tag?: string
    status?: string
    authorId?: string
    page?: number
    limit?: number
    sortBy?: string
    requesterIsAdmin?: boolean
  }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 20, 50)
    const skip = (page - 1) * limit

    const where: Record<string, any> = {}

    // public only returns published unless admin explicitly filters by status
    // spec: public only returns published, admin can see all via query status
    // So if requester is not admin -> force published. If admin -> respect status param.
    if (params.requesterIsAdmin) {
      if (params.status && params.status !== 'all') {
        if (!ALLOWED_STATUSES.includes(params.status)) {
          throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')} ou all`)
        }
        where.status = params.status
      }
      // if status not provided or 'all' => no filter (all statuses)
    } else {
      // non-admin / public -> only published. If they pass status? ignore unless = published
      // We enforce published only.
      where.status = 'published'
      // If they try to request another status, we keep published (security)
      // Optionally if they explicitly request published via status, still published
    }

    // Non-admin status handling: already forced published
    // Admin already handled

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { excerpt: { contains: params.q, mode: 'insensitive' } },
        { content: { contains: params.q, mode: 'insensitive' } },
        { slug: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.category) {
      if (!ALLOWED_CATEGORIES.includes(params.category)) {
        throw new BadRequestException(`category deve ser um de: ${ALLOWED_CATEGORIES.join(', ')}`)
      }
      where.category = params.category
    }

    if (params.tag) {
      where.tags = { has: params.tag }
    }

    if (params.authorId) where.authorId = params.authorId

    let orderBy: any
    if (params.sortBy === 'views') {
      orderBy = { viewCount: 'desc' as const }
    } else {
      // newest default: publishedAt desc then createdAt desc, fallback to createdAt desc
      orderBy = [{ publishedAt: 'desc' as const }, { createdAt: 'desc' as const }]
    }

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, avatar: true, isVerified: true } },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async adminFindAll(params: {
    q?: string
    category?: string
    tag?: string
    status?: string
    authorId?: string
    page?: number
    limit?: number
    sortBy?: string
  }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 20, 50)
    const skip = (page - 1) * limit

    const where: Record<string, any> = {}

    if (params.status && params.status !== 'all') {
      if (!ALLOWED_STATUSES.includes(params.status)) {
        throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
      }
      where.status = params.status
    }

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { excerpt: { contains: params.q, mode: 'insensitive' } },
        { content: { contains: params.q, mode: 'insensitive' } },
        { slug: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.category) where.category = params.category
    if (params.tag) where.tags = { has: params.tag }
    if (params.authorId) where.authorId = params.authorId

    const orderBy =
      params.sortBy === 'views'
        ? { viewCount: 'desc' as const }
        : params.sortBy === 'newest'
          ? { createdAt: 'desc' as const }
          : { createdAt: 'desc' as const }

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, avatar: true, isVerified: true } },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true } },
      },
    })
    if (!post) throw new NotFoundException('Post não encontrado.')

    await this.prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })

    return { ...post, viewCount: post.viewCount + 1 }
  }

  async findById(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true } },
      },
    })
    if (!post) throw new NotFoundException('Post não encontrado.')
    return post
  }

  async create(
    authorId: string,
    data: {
      title: string
      slug?: string
      excerpt?: string
      content: string
      coverImage?: string
      category?: string
      tags?: string[]
      status?: string
    },
  ) {
    if (!data.title) throw new BadRequestException('title é obrigatório')
    if (!data.content) throw new BadRequestException('content é obrigatório')

    const category = data.category ?? 'moda'
    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new BadRequestException(`category deve ser um de: ${ALLOWED_CATEGORIES.join(', ')}`)
    }

    const status = data.status ?? 'published'
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }

    const slug = await this.generateUniqueSlug(data.title, data.slug)

    const sanitized = this.contactFilter.sanitizeHtml(data.content)

    const publishedAt = status === 'published' ? new Date() : null

    return this.prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: sanitized,
        coverImage: data.coverImage,
        category,
        tags: data.tags ?? [],
        authorId,
        status,
        publishedAt,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    })
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      title: string
      slug: string
      excerpt: string
      content: string
      coverImage: string
      category: string
      tags: string[]
      status: string
    }>,
    isAdmin = false,
  ) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } })
    if (!post) throw new NotFoundException('Post não encontrado.')
    if (post.authorId !== userId && !isAdmin) throw new ForbiddenException('Apenas o autor ou admin pode editar.')

    const updateData: Record<string, any> = {}

    if (data.title !== undefined) {
      if (!data.title) throw new BadRequestException('title não pode ser vazio')
      updateData.title = data.title
    }

    if (data.slug !== undefined || data.title !== undefined) {
      // if slug explicitly provided, use it; otherwise if title changed, regenerate from new title
      // Keep uniqueness. If neither provided but title changed we already handle.
      // Spec: slug auto-generation from title if not provided. On update, if title changed and no slug passed, keep existing slug? Or regenerate?
      // Common editorial: allow changing slug if title changes but preserve uniqueness and maybe keep old slug redirect.
      // Here: if slug provided explicitly -> generate from it
      // if title changed and slug not provided -> keep existing slug (do not auto-change to avoid breaking URLs)
      // However if title changed and user wants slug regenerated they can pass slug or empty?
      // We'll implement: only regenerate if slug explicitly passed. If title changed without slug param, keep existing slug.
      if (data.slug !== undefined) {
        const baseTitle = data.title ?? post.title
        // if slug is empty string, generate from title
        const slugInput = data.slug?.trim() ? data.slug : baseTitle
        updateData.slug = await this.generateUniqueSlug(baseTitle, slugInput, id)
      }
    }

    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage

    if (data.content !== undefined) {
      updateData.content = this.contactFilter.sanitizeHtml(data.content)
    }

    if (data.category !== undefined) {
      if (!ALLOWED_CATEGORIES.includes(data.category)) {
        throw new BadRequestException(`category deve ser um de: ${ALLOWED_CATEGORIES.join(', ')}`)
      }
      updateData.category = data.category
    }

    if (data.tags !== undefined) updateData.tags = data.tags

    if (data.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(data.status)) {
        throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
      }
      updateData.status = data.status
      // adjust publishedAt: if transitioning to published and no publishedAt, set now; if to draft/archived keep existing? If draft from published keep date? We'll keep logic: published -> set publishedAt if null, other status -> keep or null? Keep as is unless publishing.
      if (data.status === 'published' && !post.publishedAt) {
        updateData.publishedAt = new Date()
      }
      if (data.status !== 'published' && post.status === 'published' && data.status === 'draft') {
        // optional: keep publishedAt for history. Do not clear.
      }
    }

    // Also need to handle title->slug implicit regenerate for new title when slug not provided? As per decision, we don't auto-update slug on title change to preserve URL.
    // But if user wants to keep slug sync, they can pass slug. Alternative: if user sent title change and expects slug to stay as before unless they send slug param, that's fine.

    return this.prisma.blogPost.update({ where: { id }, data: updateData })
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } })
    if (!post) throw new NotFoundException('Post não encontrado.')
    if (post.authorId !== userId && !isAdmin) throw new ForbiddenException('Apenas o autor ou admin pode remover.')
    return this.prisma.blogPost.delete({ where: { id } })
  }

  async mine(userId: string, params?: { page?: number; limit?: number; status?: string }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit

    const where: Record<string, any> = { authorId: userId }
    if (params?.status && params.status !== 'all') {
      if (!ALLOWED_STATUSES.includes(params.status)) {
        throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
      }
      where.status = params.status
    }

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateStatus(id: string, status: string) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }
    const post = await this.prisma.blogPost.findUnique({ where: { id } })
    if (!post) throw new NotFoundException('Post não encontrado.')

    const data: Record<string, any> = { status }
    if (status === 'published' && !post.publishedAt) {
      data.publishedAt = new Date()
    }

    return this.prisma.blogPost.update({ where: { id }, data })
  }
}
