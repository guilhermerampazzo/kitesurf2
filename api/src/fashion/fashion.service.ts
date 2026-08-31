import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma.module'

const ALLOWED_CATEGORIES = [
  'camiseta',
  'bermuda',
  'biquini',
  'bone',
  'wet_suit',
  'acessorio',
  // allow variations? keep strict to spec but allow extensibility
  // Also common aliases:
  'camisa',
  'calca',
  'vestido',
  'saia',
  'acessorios',
]
const ALLOWED_STATUSES = ['active', 'paused', 'sold', 'moderation']
const ALLOWED_CONDITIONS = ['new', 'used']

@Injectable()
export class FashionService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    q?: string
    category?: string
    brand?: string
    size?: string
    color?: string
    condition?: string
    priceMin?: number
    priceMax?: number
    isFeatured?: boolean
    status?: string
    page?: number
    limit?: number
    sortBy?: string
  }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 20, 50)
    const skip = (page - 1) * limit

    const where: Record<string, any> = {}

    if (params.status) {
      if (params.status !== 'all') where.status = params.status
    } else {
      where.status = 'active'
    }

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { brand: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.category) where.category = params.category
    if (params.brand) where.brand = { contains: params.brand, mode: 'insensitive' }
    if (params.size) where.size = params.size
    if (params.color) where.color = { contains: params.color, mode: 'insensitive' }
    if (params.condition) where.condition = params.condition
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured

    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      where.price = {}
      if (params.priceMin !== undefined) (where.price as any).gte = params.priceMin
      if (params.priceMax !== undefined) (where.price as any).lte = params.priceMax
    }

    const orderBy =
      params.sortBy === 'price_asc'
        ? { price: 'asc' as const }
        : params.sortBy === 'price_desc'
          ? { price: 'desc' as const }
          : params.sortBy === 'newest'
            ? { createdAt: 'desc' as const }
            : [{ isFeatured: 'desc' as const }, { createdAt: 'desc' as const }]

    const [data, total] = await Promise.all([
      this.prisma.fashionItem.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true } },
        },
      }),
      this.prisma.fashionItem.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async adminFindAll(params: {
    q?: string
    category?: string
    brand?: string
    size?: string
    color?: string
    condition?: string
    priceMin?: number
    priceMax?: number
    isFeatured?: boolean
    status?: string
    page?: number
    limit?: number
    sortBy?: string
  }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 20, 50)
    const skip = (page - 1) * limit

    const where: Record<string, any> = {}

    if (params.status && params.status !== 'all') where.status = params.status

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { brand: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.category) where.category = params.category
    if (params.brand) where.brand = { contains: params.brand, mode: 'insensitive' }
    if (params.size) where.size = params.size
    if (params.color) where.color = { contains: params.color, mode: 'insensitive' }
    if (params.condition) where.condition = params.condition
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured

    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      where.price = {}
      if (params.priceMin !== undefined) (where.price as any).gte = params.priceMin
      if (params.priceMax !== undefined) (where.price as any).lte = params.priceMax
    }

    const orderBy =
      params.sortBy === 'price_asc'
        ? { price: 'asc' as const }
        : params.sortBy === 'price_desc'
          ? { price: 'desc' as const }
          : params.sortBy === 'newest'
            ? { createdAt: 'desc' as const }
            : { createdAt: 'desc' as const }

    const [data, total] = await Promise.all([
      this.prisma.fashionItem.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true } },
        },
      }),
      this.prisma.fashionItem.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string) {
    const item = await this.prisma.fashionItem.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true, phone: true, email: true } },
      },
    })
    if (!item) throw new NotFoundException('Item de moda não encontrado.')

    await this.prisma.fashionItem.update({ where: { id }, data: { viewCount: { increment: 1 } } })

    return { ...item, viewCount: item.viewCount + 1 }
  }

  async create(
    sellerId: string,
    data: {
      title: string
      description: string
      category: string
      brand?: string
      size?: string
      color?: string
      condition?: string
      price: number
      images?: string[]
      status?: string
      isFeatured?: boolean
    },
  ) {
    if (!data.title || !data.description || !data.category) {
      throw new BadRequestException('title, description e category são obrigatórios')
    }
    // allow known categories but don't strictly block unknown to allow extensibility; validate if in list OR accept any lowercase?
    // Spec says camiseta|bermuda|biquini|bone|wet_suit|acessorio etc - so we validate loosely but enforce if strict list contains.
    // We'll accept any non-empty string but warn? For now allow any but normalize to lower.
    const category = data.category.toLowerCase()
    // If you want strict, uncomment:
    // if (!ALLOWED_CATEGORIES.includes(category)) throw new BadRequestException(`category deve ser um de: ${ALLOWED_CATEGORIES.join(', ')}`)

    const condition = data.condition ?? 'new'
    if (!ALLOWED_CONDITIONS.includes(condition)) {
      throw new BadRequestException(`condition deve ser um de: ${ALLOWED_CONDITIONS.join(', ')}`)
    }

    if (data.status && !ALLOWED_STATUSES.includes(data.status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }

    if (data.price === undefined || isNaN(data.price) || data.price < 0) {
      throw new BadRequestException('price deve ser um número >= 0')
    }

    return this.prisma.fashionItem.create({
      data: {
        title: data.title,
        description: data.description,
        category,
        brand: data.brand,
        size: data.size,
        color: data.color,
        condition,
        price: data.price,
        images: data.images ?? [],
        sellerId,
        status: data.status ?? 'active',
        isFeatured: data.isFeatured ?? false,
      },
      include: {
        seller: { select: { id: true, name: true, avatar: true, isVerified: true } },
      },
    })
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      title: string
      description: string
      category: string
      brand: string
      size: string
      color: string
      condition: string
      price: number
      images: string[]
      isFeatured: boolean
      status: string
    }>,
    isAdmin = false,
  ) {
    const item = await this.prisma.fashionItem.findUnique({ where: { id } })
    if (!item) throw new NotFoundException('Item de moda não encontrado.')
    if (item.sellerId !== userId && !isAdmin) throw new ForbiddenException('Apenas o proprietário pode editar.')

    if (data.condition && !ALLOWED_CONDITIONS.includes(data.condition)) {
      throw new BadRequestException(`condition deve ser um de: ${ALLOWED_CONDITIONS.join(', ')}`)
    }

    if (data.status && !isAdmin) {
      const ownerAllowed = ['active', 'paused', 'sold']
      if (!ownerAllowed.includes(data.status)) {
        throw new BadRequestException(`status deve ser um de: ${ownerAllowed.join(', ')}`)
      }
    }
    if (data.status && isAdmin && !ALLOWED_STATUSES.includes(data.status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }

    if (data.isFeatured !== undefined && !isAdmin) {
      throw new ForbiddenException('Apenas admin pode alterar isFeatured.')
    }

    const updateData: Record<string, any> = { ...data }
    if (updateData.category) updateData.category = updateData.category.toLowerCase()
    delete updateData.sellerId

    return this.prisma.fashionItem.update({ where: { id }, data: updateData })
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const item = await this.prisma.fashionItem.findUnique({ where: { id } })
    if (!item) throw new NotFoundException('Item de moda não encontrado.')
    if (item.sellerId !== userId && !isAdmin) throw new ForbiddenException('Apenas o proprietário pode remover.')
    return this.prisma.fashionItem.delete({ where: { id } })
  }

  async mine(sellerId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.fashionItem.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.fashionItem.count({ where: { sellerId } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateStatus(id: string, status: string) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }
    const item = await this.prisma.fashionItem.findUnique({ where: { id } })
    if (!item) throw new NotFoundException('Item de moda não encontrado.')
    return this.prisma.fashionItem.update({ where: { id }, data: { status } })
  }

  async updateFeatured(id: string, isFeatured: boolean) {
    const item = await this.prisma.fashionItem.findUnique({ where: { id } })
    if (!item) throw new NotFoundException('Item de moda não encontrado.')
    return this.prisma.fashionItem.update({ where: { id }, data: { isFeatured } })
  }
}
