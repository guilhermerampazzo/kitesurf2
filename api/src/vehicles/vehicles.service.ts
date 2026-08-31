import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.module'

const ALLOWED_TYPES = ['carro', 'moto', 'lancha', 'jetski', 'quadriciclo', 'trailer']
const ALLOWED_FUELS = ['gasolina', 'diesel', 'eletrico', 'flex', 'hibrido']
const ALLOWED_TRANSMISSIONS = ['manual', 'automatico', 'cvt']
const ALLOWED_STATUSES = ['active', 'paused', 'sold', 'moderation']

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    q?: string
    type?: string
    brand?: string
    model?: string
    city?: string
    state?: string
    priceMin?: number
    priceMax?: number
    yearMin?: number
    yearMax?: number
    fuel?: string
    transmission?: string
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
        { city: { contains: params.q, mode: 'insensitive' } },
        { brand: { contains: params.q, mode: 'insensitive' } },
        { model: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.type) where.type = params.type
    if (params.brand) where.brand = { contains: params.brand, mode: 'insensitive' }
    if (params.model) where.model = { contains: params.model, mode: 'insensitive' }
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' }
    if (params.state) where.state = params.state
    if (params.fuel) where.fuel = params.fuel
    if (params.transmission) where.transmission = params.transmission
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured

    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      where.price = {}
      if (params.priceMin !== undefined) (where.price as any).gte = params.priceMin
      if (params.priceMax !== undefined) (where.price as any).lte = params.priceMax
    }

    if (params.yearMin !== undefined || params.yearMax !== undefined) {
      where.year = {}
      if (params.yearMin !== undefined) (where.year as any).gte = params.yearMin
      if (params.yearMax !== undefined) (where.year as any).lte = params.yearMax
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
      this.prisma.vehicle.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true } },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async adminFindAll(params: {
    q?: string
    type?: string
    brand?: string
    model?: string
    city?: string
    state?: string
    priceMin?: number
    priceMax?: number
    yearMin?: number
    yearMax?: number
    fuel?: string
    transmission?: string
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
        { city: { contains: params.q, mode: 'insensitive' } },
        { brand: { contains: params.q, mode: 'insensitive' } },
        { model: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.type) where.type = params.type
    if (params.brand) where.brand = { contains: params.brand, mode: 'insensitive' }
    if (params.model) where.model = { contains: params.model, mode: 'insensitive' }
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' }
    if (params.state) where.state = params.state
    if (params.fuel) where.fuel = params.fuel
    if (params.transmission) where.transmission = params.transmission
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured

    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      where.price = {}
      if (params.priceMin !== undefined) (where.price as any).gte = params.priceMin
      if (params.priceMax !== undefined) (where.price as any).lte = params.priceMax
    }

    if (params.yearMin !== undefined || params.yearMax !== undefined) {
      where.year = {}
      if (params.yearMin !== undefined) (where.year as any).gte = params.yearMin
      if (params.yearMax !== undefined) (where.year as any).lte = params.yearMax
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
      this.prisma.vehicle.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true } },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true, phone: true, email: true } },
      },
    })
    if (!vehicle) throw new NotFoundException('Veículo não encontrado.')

    await this.prisma.vehicle.update({ where: { id }, data: { viewCount: { increment: 1 } } })

    return { ...vehicle, viewCount: vehicle.viewCount + 1 }
  }

  async create(
    sellerId: string,
    data: {
      title: string
      description: string
      type: string
      brand?: string
      model?: string
      year?: number
      mileage?: number
      fuel?: string
      transmission?: string
      color?: string
      city: string
      state: string
      price: number
      images?: string[]
      features?: string[]
      status?: string
      isFeatured?: boolean
    },
  ) {
    if (!ALLOWED_TYPES.includes(data.type)) {
      throw new BadRequestException(`type deve ser um de: ${ALLOWED_TYPES.join(', ')}`)
    }
    if (data.fuel && !ALLOWED_FUELS.includes(data.fuel)) {
      throw new BadRequestException(`fuel deve ser um de: ${ALLOWED_FUELS.join(', ')}`)
    }
    if (data.transmission && !ALLOWED_TRANSMISSIONS.includes(data.transmission)) {
      throw new BadRequestException(`transmission deve ser um de: ${ALLOWED_TRANSMISSIONS.join(', ')}`)
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
    if (data.year !== undefined && (isNaN(data.year) || data.year < 1900 || data.year > 2100)) {
      throw new BadRequestException('year deve estar entre 1900 e 2100')
    }
    if (data.mileage !== undefined && (isNaN(data.mileage) || data.mileage < 0)) {
      throw new BadRequestException('mileage deve ser >= 0')
    }

    // Commission rate for future order flow (not enforced on create, but fetched for reference)
    // const rate = await this.commissionService?.getRate('veiculos') // will be used when Payment is created on sale

    return this.prisma.vehicle.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        brand: data.brand,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        fuel: data.fuel,
        transmission: data.transmission,
        color: data.color,
        city: data.city,
        state: data.state,
        price: data.price,
        images: data.images ?? [],
        features: data.features ?? [],
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
      brand: string
      model: string
      year: number
      mileage: number
      fuel: string
      transmission: string
      color: string
      city: string
      state: string
      price: number
      images: string[]
      features: string[]
      isFeatured: boolean
      status: string
    }>,
    isAdmin = false,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) throw new NotFoundException('Veículo não encontrado.')
    if (vehicle.sellerId !== userId && !isAdmin) throw new ForbiddenException('Apenas o proprietário pode editar.')

    if (data.type && !ALLOWED_TYPES.includes(data.type)) {
      throw new BadRequestException(`type deve ser um de: ${ALLOWED_TYPES.join(', ')}`)
    }
    if (data.fuel && !ALLOWED_FUELS.includes(data.fuel)) {
      throw new BadRequestException(`fuel deve ser um de: ${ALLOWED_FUELS.join(', ')}`)
    }
    if (data.transmission && !ALLOWED_TRANSMISSIONS.includes(data.transmission)) {
      throw new BadRequestException(`transmission deve ser um de: ${ALLOWED_TRANSMISSIONS.join(', ')}`)
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
    if (data.year !== undefined && (isNaN(data.year as any) || (data.year as number) < 1900 || (data.year as number) > 2100)) {
      throw new BadRequestException('year deve estar entre 1900 e 2100')
    }
    if (data.mileage !== undefined && (isNaN(data.mileage as any) || (data.mileage as number) < 0)) {
      throw new BadRequestException('mileage deve ser >= 0')
    }
    if (data.price !== undefined && (isNaN(data.price as any) || (data.price as number) < 0)) {
      throw new BadRequestException('price deve ser >= 0')
    }

    const updateData: Record<string, any> = { ...data }
    delete updateData.sellerId

    return this.prisma.vehicle.update({ where: { id }, data: updateData })
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) throw new NotFoundException('Veículo não encontrado.')
    if (vehicle.sellerId !== userId && !isAdmin) throw new ForbiddenException('Apenas o proprietário pode remover.')
    return this.prisma.vehicle.delete({ where: { id } })
  }

  async mine(sellerId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.vehicle.count({ where: { sellerId } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateStatus(id: string, status: string) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) throw new NotFoundException('Veículo não encontrado.')
    return this.prisma.vehicle.update({ where: { id }, data: { status } })
  }

  async toggleFeatured(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) throw new NotFoundException('Veículo não encontrado.')
    return this.prisma.vehicle.update({ where: { id }, data: { isFeatured: !vehicle.isFeatured } })
  }

  async setFeatured(id: string, isFeatured: boolean) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) throw new NotFoundException('Veículo não encontrado.')
    return this.prisma.vehicle.update({ where: { id }, data: { isFeatured } })
  }
}
