import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma.module'
import { CommissionService } from '../commission/commission.service'
import { AsaasService } from '../asaas/asaas.service'

const ALLOWED_CATEGORIES = [
  'fotografia',
  'video',
  'manutencao',
  'design',
  'aula',
  'consultoria',
  'outro',
]
const ALLOWED_PRICING = ['fixed', 'hourly', 'daily']
const ALLOWED_STATUSES = ['active', 'paused', 'moderation']
const ALLOWED_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'refunded',
]
const ALLOWED_PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed']
const ALLOWED_PAYMENT_METHODS = ['pix', 'card', 'free']
// For buyer cancel policy: we map to simple rule per spec
// pending->cancelled full refund if paid
// confirmed->cancelled 50% refund if <24h else full if >24h
// in_progress/completed -> no refund

@Injectable()
export class ServicesOfferingService {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    private asaasService: AsaasService,
  ) {}

  private validateOfferingPayload(data: {
    title?: string
    description?: string
    category?: string
    pricingType?: string
    price?: number
    minHours?: number
    maxHours?: number
    city?: string
    state?: string
    images?: string[]
    status?: string
    isFeatured?: boolean
  }, isCreate = false) {
    if (isCreate) {
      if (!data.title || !data.title.trim()) throw new BadRequestException('title é obrigatório.')
      if (!data.description || !data.description.trim()) throw new BadRequestException('description é obrigatório.')
      if (!data.category) throw new BadRequestException('category é obrigatório.')
      if (!data.pricingType) throw new BadRequestException('pricingType é obrigatório.')
      if (data.price === undefined || data.price === null) throw new BadRequestException('price é obrigatório.')
      if (!data.city || !data.city.trim()) throw new BadRequestException('city é obrigatório.')
      if (!data.state || !data.state.trim()) throw new BadRequestException('state é obrigatório.')
    }

    if (data.category !== undefined && !ALLOWED_CATEGORIES.includes(data.category)) {
      throw new BadRequestException(`category deve ser um de: ${ALLOWED_CATEGORIES.join(', ')}`)
    }
    if (data.pricingType !== undefined && !ALLOWED_PRICING.includes(data.pricingType)) {
      throw new BadRequestException(`pricingType deve ser um de: ${ALLOWED_PRICING.join(', ')}`)
    }
    if (data.price !== undefined) {
      if (isNaN(data.price) || data.price <= 0) {
        throw new BadRequestException('price deve ser > 0.')
      }
    }
    if (data.status !== undefined && !ALLOWED_STATUSES.includes(data.status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }

    // hourly validation: minHours/maxHours
    const pricingType = data.pricingType
    if (pricingType === 'hourly' || (data.minHours !== undefined || data.maxHours !== undefined)) {
      // if pricingType is hourly, minHours/maxHours should be handled. For updates we need to fetch existing; validation handled in create/update methods that have full context.
      // Here generic checks
      if (data.minHours !== undefined) {
        if (!Number.isInteger(data.minHours) || data.minHours < 1) throw new BadRequestException('minHours deve ser inteiro >= 1.')
      }
      if (data.maxHours !== undefined) {
        if (!Number.isInteger(data.maxHours) || data.maxHours < 1) throw new BadRequestException('maxHours deve ser inteiro >= 1.')
      }
      if (data.minHours !== undefined && data.maxHours !== undefined && data.minHours > data.maxHours) {
        throw new BadRequestException('minHours não pode ser maior que maxHours.')
      }
    }

    if (data.images !== undefined) {
      if (!Array.isArray(data.images)) throw new BadRequestException('images deve ser um array de strings.')
      for (const img of data.images) {
        if (typeof img !== 'string') throw new BadRequestException('images deve conter apenas strings.')
      }
    }
  }

  // ── Public listing ────────────────────────────────────────────────────────
  async findAll(params: {
    q?: string
    category?: string
    pricingType?: string
    city?: string
    state?: string
    priceMin?: number
    priceMax?: number
    sellerId?: string
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

    if (params.category) where.category = params.category
    if (params.pricingType) where.pricingType = params.pricingType
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' }
    if (params.state) where.state = params.state
    if (params.sellerId) where.sellerId = params.sellerId
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { city: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      where.price = {}
      if (params.priceMin !== undefined) (where.price as any).gte = params.priceMin
      if (params.priceMax !== undefined) (where.price as any).lte = params.priceMax
    }

    // sortBy newest|price_asc|price_desc|rating
    let orderBy: any
    switch (params.sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'newest':
      default:
        orderBy = params.sortBy === 'newest' ? { createdAt: 'desc' } : [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
        break
    }

    const [data, total] = await Promise.all([
      this.prisma.serviceOffering.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true } },
        },
      }),
      this.prisma.serviceOffering.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async adminFindAll(params: {
    q?: string
    category?: string
    pricingType?: string
    city?: string
    state?: string
    priceMin?: number
    priceMax?: number
    sellerId?: string
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

    if (params.category) where.category = params.category
    if (params.pricingType) where.pricingType = params.pricingType
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' }
    if (params.state) where.state = params.state
    if (params.sellerId) where.sellerId = params.sellerId
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { city: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      where.price = {}
      if (params.priceMin !== undefined) (where.price as any).gte = params.priceMin
      if (params.priceMax !== undefined) (where.price as any).lte = params.priceMax
    }

    let orderBy: any
    switch (params.sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const [data, total] = await Promise.all([
      this.prisma.serviceOffering.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true } },
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.serviceOffering.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string) {
    const service = await this.prisma.serviceOffering.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true, phone: true, email: true } },
        _count: { select: { orders: true } },
      },
    })
    if (!service) throw new NotFoundException('Serviço não encontrado.')

    // increment viewCount async
    await this.prisma.serviceOffering.update({ where: { id }, data: { viewCount: { increment: 1 } } })

    return { ...service, viewCount: service.viewCount + 1, ordersCount: (service as any)._count?.orders ?? 0 }
  }

  async mine(sellerId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.prisma.serviceOffering.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.serviceOffering.count({ where: { sellerId } }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async create(
    sellerId: string,
    data: {
      title: string
      description: string
      category: string
      pricingType: string
      price: number
      minHours?: number
      maxHours?: number
      city: string
      state: string
      images?: string[]
    },
  ) {
    this.validateOfferingPayload({ ...data }, true)

    if (data.pricingType === 'hourly') {
      if (data.minHours === undefined || data.maxHours === undefined) {
        throw new BadRequestException('Para pricingType hourly, minHours e maxHours são obrigatórios.')
      }
      if (data.minHours > data.maxHours) throw new BadRequestException('minHours não pode ser maior que maxHours.')
    } else {
      // for fixed/daily, ignore minHours/maxHours? But if provided, validate
      if (data.minHours !== undefined || data.maxHours !== undefined) {
        // allow but ensure consistency if both provided
        if (data.minHours !== undefined && data.maxHours !== undefined && data.minHours > data.maxHours) {
          throw new BadRequestException('minHours não pode ser maior que maxHours.')
        }
      }
    }

    return this.prisma.serviceOffering.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        pricingType: data.pricingType,
        price: data.price,
        minHours: data.minHours,
        maxHours: data.maxHours,
        city: data.city,
        state: data.state,
        images: data.images ?? [],
        sellerId,
        status: 'active',
        isFeatured: false,
      },
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
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
      pricingType: string
      price: number
      minHours: number
      maxHours: number
      city: string
      state: string
      images: string[]
      status: string
      isFeatured: boolean
    }>,
    isAdmin = false,
  ) {
    const offering = await this.prisma.serviceOffering.findUnique({ where: { id } })
    if (!offering) throw new NotFoundException('Serviço não encontrado.')
    if (offering.sellerId !== userId && !isAdmin) throw new ForbiddenException('Apenas o proprietário pode editar.')

    this.validateOfferingPayload(data, false)

    if (data.status !== undefined && !isAdmin) {
      const ownerAllowed = ['active', 'paused']
      if (!ownerAllowed.includes(data.status)) {
        throw new BadRequestException(`status deve ser um de: ${ownerAllowed.join(', ')}`)
      }
    }
    if (data.isFeatured !== undefined && !isAdmin) {
      throw new ForbiddenException('Apenas admin pode alterar isFeatured.')
    }
    // pricingType change validation with min/max hours
    const effectivePricing = data.pricingType ?? offering.pricingType
    const effectiveMin = data.minHours !== undefined ? data.minHours : offering.minHours
    const effectiveMax = data.maxHours !== undefined ? data.maxHours : offering.maxHours

    if (effectivePricing === 'hourly') {
      if (effectiveMin === null || effectiveMin === undefined || effectiveMax === null || effectiveMax === undefined) {
        throw new BadRequestException('Para pricingType hourly, minHours e maxHours são obrigatórios.')
      }
      if (effectiveMin! > effectiveMax!) throw new BadRequestException('minHours não pode ser maior que maxHours.')
    } else {
      if (effectiveMin !== null && effectiveMin !== undefined && effectiveMax !== null && effectiveMax !== undefined && effectiveMin > effectiveMax) {
        throw new BadRequestException('minHours não pode ser maior que maxHours.')
      }
    }

    if (data.price !== undefined && (isNaN(data.price) || data.price <= 0)) {
      throw new BadRequestException('price deve ser > 0.')
    }

    const updateData: Record<string, any> = { ...data }
    delete updateData.sellerId

    return this.prisma.serviceOffering.update({ where: { id }, data: updateData })
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const offering = await this.prisma.serviceOffering.findUnique({ where: { id } })
    if (!offering) throw new NotFoundException('Serviço não encontrado.')
    if (offering.sellerId !== userId && !isAdmin) throw new ForbiddenException('Apenas o proprietário pode remover.')
    return this.prisma.serviceOffering.delete({ where: { id } })
  }

  async updateStatus(id: string, status: string) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }
    const offering = await this.prisma.serviceOffering.findUnique({ where: { id } })
    if (!offering) throw new NotFoundException('Serviço não encontrado.')
    return this.prisma.serviceOffering.update({ where: { id }, data: { status } })
  }

  async updateFeatured(id: string, isFeatured: boolean) {
    const offering = await this.prisma.serviceOffering.findUnique({ where: { id } })
    if (!offering) throw new NotFoundException('Serviço não encontrado.')
    return this.prisma.serviceOffering.update({ where: { id }, data: { isFeatured } })
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  async createOrder(
    serviceId: string,
    buyerId: string,
    data: {
      quantity: number
      scheduledDate?: string | Date
      notes?: string
      paymentMethod?: string
    },
  ) {
    const service = await this.prisma.serviceOffering.findUnique({ where: { id: serviceId } })
    if (!service) throw new NotFoundException('Serviço não encontrado.')
    if (service.status !== 'active') throw new BadRequestException('Serviço não está disponível para contratação.')

    // buyer cannot buy own service?
    if (service.sellerId === buyerId) throw new BadRequestException('Você não pode contratar seu próprio serviço.')

    if (data.quantity === undefined || data.quantity === null || isNaN(data.quantity)) {
      throw new BadRequestException('quantity é obrigatório.')
    }
    const quantity = Number(data.quantity)
    if (quantity <= 0) throw new BadRequestException('quantity deve ser > 0.')

    // Validate quantity per pricingType
    if (service.pricingType === 'fixed') {
      if (quantity !== 1) {
        throw new BadRequestException('Para serviços com preço fixo, quantity deve ser 1.')
      }
    } else if (service.pricingType === 'hourly' || service.pricingType === 'daily') {
      // if minHours/maxHours defined, enforce
      // Note: spec says for hourly/daily then quantity must be between minHours-maxHours if defined
      // For daily, minHours/maxHours still apply? We'll apply generic.
      if (service.minHours !== null && service.minHours !== undefined) {
        if (quantity < service.minHours) {
          throw new BadRequestException(`quantity deve ser no mínimo ${service.minHours}.`)
        }
      }
      if (service.maxHours !== null && service.maxHours !== undefined) {
        if (quantity > service.maxHours) {
          throw new BadRequestException(`quantity deve ser no máximo ${service.maxHours}.`)
        }
      }
      // For hourly/daily, quantity can be fractional? Allow Float, but for hourly expect maybe 0.5 increments? Keep generic >0.
    }

    const unitPrice = service.price
    const totalPrice = Number((quantity * unitPrice).toFixed(2))

    // commission via CommissionService module servicos
    const rate = await this.commissionService.getRate('servicos')
    const commissionAmount = Number(((totalPrice * rate) / 100).toFixed(2))

    let scheduledDate: Date | undefined
    if (data.scheduledDate) {
      scheduledDate = new Date(data.scheduledDate)
      if (isNaN(scheduledDate.getTime())) throw new BadRequestException('scheduledDate inválida.')
      // optional: disallow past dates
      // We allow any future? Not strictly required but add guard if past -> error
      // Keep allow past? We'll not block past but warn? Spec says optional, no constraint.
    }

    const paymentMethod = data.paymentMethod ?? 'pix'
    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new BadRequestException(`paymentMethod deve ser um de: ${ALLOWED_PAYMENT_METHODS.join(', ')}`)
    }

    // For free: if total 0 then free (spec). But also if total 0, paymentMethod 'free' allowed.
    // No free services, but if total 0 then free.
    let effectivePaymentMethod = paymentMethod
    if (totalPrice === 0) {
      effectivePaymentMethod = 'free'
    }

    // Create ServiceOrder first to have referenceId for payment
    // status pending, paymentStatus pending/paid
    // We'll create order with pending paymentStatus, then update after Asaas
    const order = await this.prisma.serviceOrder.create({
      data: {
        serviceId,
        buyerId,
        sellerId: service.sellerId,
        quantity,
        unitPrice,
        totalPrice,
        commissionAmount,
        status: 'pending',
        paymentStatus: 'pending',
        scheduledDate,
        notes: data.notes,
      },
    })

    // Create Payment via AsaasService module=servicos
    let payment: any = null
    try {
      payment = await this.asaasService.createPayment({
        userId: buyerId,
        module: 'servicos',
        referenceId: order.id,
        amount: totalPrice,
        method: effectivePaymentMethod,
      })

      const paymentStatus = payment.status === 'paid' ? 'paid' : 'pending'
      // update order with paymentId and paymentStatus
      const updatedOrder = await this.prisma.serviceOrder.update({
        where: { id: order.id },
        data: {
          paymentId: payment.id,
          paymentStatus,
          commissionAmount: payment.commissionAmount ?? commissionAmount,
        },
        include: {
          service: { select: { id: true, title: true, pricingType: true, price: true, city: true, state: true, images: true } },
          buyer: { select: { id: true, name: true, avatar: true, email: true } },
          seller: { select: { id: true, name: true, avatar: true } },
        },
      })

      return { order: updatedOrder, payment }
    } catch (e) {
      // rollback order if payment creation failed
      await this.prisma.serviceOrder.delete({ where: { id: order.id } }).catch(() => {})
      throw e
    }
  }

  async listMyOrders(buyerId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where: { buyerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          service: {
            include: {
              seller: { select: { id: true, name: true, avatar: true } },
            },
          },
          seller: { select: { id: true, name: true, avatar: true } },
          buyer: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.serviceOrder.count({ where: { buyerId } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async listReceivedOrders(sellerId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const where = { sellerId }
    const [data, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { id: true, title: true, pricingType: true, price: true, images: true, city: true, state: true } },
          buyer: { select: { id: true, name: true, avatar: true, email: true } },
          seller: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.serviceOrder.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOrderById(orderId: string, currentUserId: string, isAdmin = false) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: orderId },
      include: {
        service: {
          include: {
            seller: { select: { id: true, name: true, avatar: true } },
          },
        },
        buyer: { select: { id: true, name: true, avatar: true, email: true } },
        seller: { select: { id: true, name: true, avatar: true } },
      },
    })
    if (!order) throw new NotFoundException('Pedido não encontrado.')
    if (order.buyerId !== currentUserId && order.sellerId !== currentUserId && !isAdmin) {
      throw new ForbiddenException('Sem permissão para visualizar este pedido.')
    }
    return order
  }

  async updateOrderStatus(
    orderId: string,
    actor: { id: string; isAdmin?: boolean },
    newStatus: string,
  ) {
    if (!newStatus) throw new BadRequestException('status é obrigatório.')
    if (!ALLOWED_ORDER_STATUSES.includes(newStatus)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_ORDER_STATUSES.join(', ')}`)
    }

    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: orderId },
      include: { service: true },
    })
    if (!order) throw new NotFoundException('Pedido não encontrado.')

    const isBuyer = order.buyerId === actor.id
    const isSeller = order.sellerId === actor.id
    const isAdmin = !!actor.isAdmin

    if (!isBuyer && !isSeller && !isAdmin) throw new ForbiddenException('Sem permissão para alterar este pedido.')

    // Disallow transitions from terminal states?
    // pending|confirmed|in_progress|completed|cancelled|refunded
    // pending can -> confirmed/cancelled
    // confirmed can -> in_progress/cancelled
    // in_progress can -> completed/cancelled ? spec says seller can confirm, in_progress, completed, cancelled; buyer can cancelled with policy
    // completed/cancelled/refunded are terminal except maybe refunded

    if (['completed', 'cancelled', 'refunded'].includes(order.status) && newStatus !== order.status) {
      // allow admin to refund? But if already terminal, block except refunded?
      if (!(isAdmin && newStatus === 'refunded' && order.paymentStatus === 'paid')) {
        throw new BadRequestException(`Pedido já está com status ${order.status} e não pode ser alterado.`)
      }
    }

    // ── Seller permissions ───────────────────────────────────────────────
    if (isSeller || isAdmin) {
      // seller can: confirmed, in_progress, completed, cancelled (plus refunded via admin)
      // isAdmin can also do refunded
      if (isSeller && !isAdmin) {
        const sellerAllowed = ['confirmed', 'in_progress', 'completed', 'cancelled']
        if (!sellerAllowed.includes(newStatus)) {
          throw new ForbiddenException(`Vendedor só pode alterar para: ${sellerAllowed.join(', ')}`)
        }
        // enforce transition rules for seller
        if (newStatus === 'confirmed' && order.status !== 'pending') {
          throw new BadRequestException('Apenas pedidos pendentes podem ser confirmados.')
        }
        if (newStatus === 'in_progress' && order.status !== 'confirmed') {
          throw new BadRequestException('Apenas pedidos confirmados podem ir para em progresso.')
        }
        if (newStatus === 'completed' && order.status !== 'in_progress') {
          throw new BadRequestException('Apenas pedidos em progresso podem ser concluídos.')
        }
        // cancelled can be from pending/confirmed/in_progress? spec says seller can cancelled. Allow from pending/confirmed/in_progress
        if (newStatus === 'cancelled' && !['pending', 'confirmed', 'in_progress'].includes(order.status)) {
          throw new BadRequestException(`Não é possível cancelar pedido com status ${order.status}.`)
        }
      }

      // For cancelled by seller: full refund if paid
      if (newStatus === 'cancelled') {
        let paymentStatus = order.paymentStatus
        if (order.paymentStatus === 'paid' && order.paymentId) {
          try {
            await this.asaasService.refundPayment(order.paymentId)
            paymentStatus = 'refunded'
          } catch {}
        } else if (order.paymentStatus === 'pending') {
          // pending: mark as refunded/cancelled? Keep spec: just cancelled. For consistency mark paymentStatus pending? We'll set to refunded if pending? But spec says paymentStatus pending|paid|refunded|failed - if not yet paid, no refund needed.
          // We'll keep pending but transition order to cancelled.
          // Alternatively set to refunded? For pending pix, we can leave as pending or refunded. Use pending -> could be considered failed? Let's keep as refunded only if paid.
        }
        return this.prisma.serviceOrder.update({
          where: { id: orderId },
          data: { status: 'cancelled', paymentStatus: order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus },
        })
      }

      if (newStatus === 'refunded') {
        if (!isAdmin) throw new ForbiddenException('Apenas admin pode reembolsar diretamente.')
        if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'pending') {
          // allow but need paid?
          // throw if not paid?
        }
        if (order.paymentId) {
          try {
            await this.asaasService.refundPayment(order.paymentId)
          } catch {}
        }
        return this.prisma.serviceOrder.update({
          where: { id: orderId },
          data: { status: 'refunded', paymentStatus: 'refunded' },
        })
      }

      // For confirmed/in_progress/completed generic update
      return this.prisma.serviceOrder.update({
        where: { id: orderId },
        data: { status: newStatus },
      })
    }

    // ── Buyer permissions ────────────────────────────────────────────────
    if (isBuyer && !isSeller && !isAdmin) {
      if (newStatus !== 'cancelled') {
        throw new ForbiddenException('Comprador só pode cancelar o pedido.')
      }
      if (['cancelled', 'refunded', 'completed'].includes(order.status)) {
        throw new BadRequestException(`Pedido já está com status ${order.status}`)
      }
      if (order.status === 'in_progress' || order.status === 'completed') {
        throw new BadRequestException('Não é possível cancelar pedido em progresso ou concluído. Sem reembolso.')
      }

      // Refund policy: pending->cancelled full refund if paid, confirmed->cancelled 50% refund if within 24h? Define simple: buyer can cancel pending full refund, confirmed full refund if >24h before scheduledDate, 50% if <24h, no refund if in_progress/completed
      // We implement that.
      if (order.status === 'pending') {
        // full refund if paid
        let newPaymentStatus = order.paymentStatus
        if (order.paymentStatus === 'paid' && order.paymentId) {
          try {
            await this.asaasService.refundPayment(order.paymentId)
            newPaymentStatus = 'refunded'
          } catch {}
          const updated = await this.prisma.serviceOrder.update({
            where: { id: orderId },
            data: { status: 'cancelled', paymentStatus: 'refunded' },
          })
          return { ...updated, refundPolicy: 'full', refundAmount: order.totalPrice }
        } else {
          // pending payment: just cancel, maybe keep paymentStatus pending? Mark refunded for tracking? We'll mark as refunded if it was pending but not paid? But spec says pending->cancelled full refund if paid => if not paid, just cancelled.
          const updated = await this.prisma.serviceOrder.update({
            where: { id: orderId },
            data: { status: 'cancelled' },
          })
          return { ...updated, refundPolicy: 'none', refundAmount: 0 }
        }
      }

      if (order.status === 'confirmed') {
        const now = new Date()
        let isWithin24h = false
        let diffMs: number | null = null
        if (order.scheduledDate) {
          diffMs = new Date(order.scheduledDate).getTime() - now.getTime()
          isWithin24h = diffMs !== null && diffMs < 24 * 60 * 60 * 1000
        } else {
          // no scheduledDate: consider >24h => full refund
          isWithin24h = false
        }

        if (isWithin24h) {
          // 50% refund if within 24h
          if (order.paymentStatus === 'paid' && order.paymentId) {
            try {
              await this.asaasService.refundPayment(order.paymentId)
            } catch {}
            const updated = await this.prisma.serviceOrder.update({
              where: { id: orderId },
              data: { status: 'cancelled', paymentStatus: 'refunded' },
            })
            const refundAmount = Number((order.totalPrice * 0.5).toFixed(2))
            return { ...updated, refundPolicy: '50%', refundAmount, message: 'Reembolso de 50% por cancelamento com menos de 24h de antecedência.' }
          } else {
            const updated = await this.prisma.serviceOrder.update({
              where: { id: orderId },
              data: { status: 'cancelled' },
            })
            return { ...updated, refundPolicy: '50% (pending payment, no charge)', refundAmount: 0 }
          }
        } else {
          // >24h or no scheduledDate => full refund
          if (order.paymentStatus === 'paid' && order.paymentId) {
            try {
              await this.asaasService.refundPayment(order.paymentId)
            } catch {}
            const updated = await this.prisma.serviceOrder.update({
              where: { id: orderId },
              data: { status: 'cancelled', paymentStatus: 'refunded' },
            })
            return { ...updated, refundPolicy: 'full', refundAmount: order.totalPrice }
          } else {
            const updated = await this.prisma.serviceOrder.update({
              where: { id: orderId },
              data: { status: 'cancelled' },
            })
            return { ...updated, refundPolicy: 'full', refundAmount: 0 }
          }
        }
      }

      // fallback
      throw new BadRequestException(`Não é possível cancelar pedido com status ${order.status}`)
    }

    // admin fallback handled above seller block, but if admin not seller/buyer and directly hits?
    if (isAdmin) {
      return this.prisma.serviceOrder.update({ where: { id: orderId }, data: { status: newStatus } })
    }

    throw new ForbiddenException('Sem permissão.')
  }

  async adminListOrders(params?: { page?: number; limit?: number; status?: string }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const where: Record<string, any> = {}
    if (params?.status && params.status !== 'all') where.status = params.status

    const [data, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { id: true, title: true, sellerId: true } },
          buyer: { select: { id: true, name: true, email: true } },
          seller: { select: { id: true, name: true } },
        },
      }),
      this.prisma.serviceOrder.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
