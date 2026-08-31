import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.module'

const ALLOWED_TYPES = ['casa', 'apartamento', 'terreno', 'comercial', 'kitnet', 'cobertura']
const ALLOWED_PURPOSES = ['venda', 'aluguel']
const ALLOWED_STATUSES = ['active', 'paused', 'sold', 'rented', 'moderation']

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    q?: string
    type?: string
    purpose?: string
    city?: string
    state?: string
    priceMin?: number
    priceMax?: number
    bedrooms?: number
    status?: string
    isFeatured?: boolean
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
        { city: { contains: params.q, mode: 'insensitive' } },
        { address: { contains: params.q, mode: 'insensitive' } },
        { neighborhood: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.type) where.type = params.type
    if (params.purpose) where.purpose = params.purpose
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' }
    if (params.state) where.state = params.state
    if (params.bedrooms !== undefined) where.bedrooms = params.bedrooms
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
      this.prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async adminFindAll(params: {
    q?: string
    type?: string
    purpose?: string
    city?: string
    state?: string
    priceMin?: number
    priceMax?: number
    bedrooms?: number
    status?: string
    isFeatured?: boolean
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
        { city: { contains: params.q, mode: 'insensitive' } },
        { address: { contains: params.q, mode: 'insensitive' } },
        { neighborhood: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.type) where.type = params.type
    if (params.purpose) where.purpose = params.purpose
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' }
    if (params.state) where.state = params.state
    if (params.bedrooms !== undefined) where.bedrooms = params.bedrooms
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
            : [{ createdAt: 'desc' as const }]

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true, phone: true, email: true } },
      },
    })
    if (!property) throw new NotFoundException('Imóvel não encontrado.')

    await this.prisma.property.update({ where: { id }, data: { viewCount: { increment: 1 } } })

    return { ...property, viewCount: property.viewCount + 1 }
  }

  async create(
    sellerId: string,
    data: {
      title: string
      description: string
      type: string
      purpose: string
      price: number
      bedrooms?: number
      bathrooms?: number
      suites?: number
      area?: number
      garageSpots?: number
      city: string
      state: string
      address?: string
      neighborhood?: string
      lat?: number
      lng?: number
      features?: string[]
      images?: string[]
      isFeatured?: boolean
      status?: string
    },
  ) {
    if (!ALLOWED_TYPES.includes(data.type)) {
      throw new BadRequestException(`type deve ser um de: ${ALLOWED_TYPES.join(', ')}`)
    }
    if (!ALLOWED_PURPOSES.includes(data.purpose)) {
      throw new BadRequestException(`purpose deve ser um de: ${ALLOWED_PURPOSES.join(', ')}`)
    }
    if (data.status && !ALLOWED_STATUSES.includes(data.status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }
    if (data.price === undefined || isNaN(data.price) || data.price < 0) {
      throw new BadRequestException('price deve ser um número >= 0')
    }
    if (!data.title || !data.description || !data.city || !data.state) {
      throw new BadRequestException('title, description, city e state são obrigatórios')
    }

    return this.prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        purpose: data.purpose,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        suites: data.suites,
        area: data.area,
        garageSpots: data.garageSpots,
        city: data.city,
        state: data.state,
        address: data.address,
        neighborhood: data.neighborhood,
        lat: data.lat,
        lng: data.lng,
        features: data.features ?? [],
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
      type: string
      purpose: string
      price: number
      bedrooms: number
      bathrooms: number
      suites: number
      area: number
      garageSpots: number
      city: string
      state: string
      address: string
      neighborhood: string
      lat: number
      lng: number
      features: string[]
      images: string[]
      isFeatured: boolean
      status: string
    }>,
    isAdmin = false,
  ) {
    const property = await this.prisma.property.findUnique({ where: { id } })
    if (!property) throw new NotFoundException('Imóvel não encontrado.')
    if (property.sellerId !== userId && !isAdmin) throw new ForbiddenException('Apenas o proprietário pode editar.')

    if (data.type && !ALLOWED_TYPES.includes(data.type)) {
      throw new BadRequestException(`type deve ser um de: ${ALLOWED_TYPES.join(', ')}`)
    }
    if (data.purpose && !ALLOWED_PURPOSES.includes(data.purpose)) {
      throw new BadRequestException(`purpose deve ser um de: ${ALLOWED_PURPOSES.join(', ')}`)
    }
    if (data.status && !isAdmin) {
      // owner cannot directly set to moderation? allow but restrict to active/paused/sold/rented
      const ownerAllowed = ['active', 'paused', 'sold', 'rented']
      if (!ownerAllowed.includes(data.status)) {
        throw new BadRequestException(`status deve ser um de: ${ownerAllowed.join(', ')}`)
      }
    }
    if (data.status && isAdmin && !ALLOWED_STATUSES.includes(data.status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }

    // Non-admin cannot set isFeatured directly
    if (data.isFeatured !== undefined && !isAdmin) {
      throw new ForbiddenException('Apenas admin pode alterar isFeatured.')
    }

    const updateData: Record<string, any> = { ...data }
    // prevent changing sellerId
    delete updateData.sellerId

    return this.prisma.property.update({ where: { id }, data: updateData })
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const property = await this.prisma.property.findUnique({ where: { id } })
    if (!property) throw new NotFoundException('Imóvel não encontrado.')
    if (property.sellerId !== userId && !isAdmin) throw new ForbiddenException('Apenas o proprietário pode remover.')
    return this.prisma.property.delete({ where: { id } })
  }

  async mine(userId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.property.count({ where: { sellerId: userId } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateStatus(id: string, status: string) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }
    const property = await this.prisma.property.findUnique({ where: { id } })
    if (!property) throw new NotFoundException('Imóvel não encontrado.')
    return this.prisma.property.update({ where: { id }, data: { status } })
  }
}
