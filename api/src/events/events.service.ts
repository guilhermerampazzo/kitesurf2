import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma.module'
import { CommissionService } from '../commission/commission.service'
import { AsaasService } from '../asaas/asaas.service'
import { v4 as uuidv4 } from 'uuid'

// constants
const FEATURED_PRICE = 99.9
const FEATURED_DURATION_DAYS = 30

function randomBackupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    private asaasService: AsaasService,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────

  private async ensureUniqueBackupCode(): Promise<string> {
    // loop with db check to guarantee uniqueness
    for (let attempts = 0; attempts < 20; attempts++) {
      const code = randomBackupCode()
      const exists = await this.prisma.eventTicket.findUnique({ where: { backupCode: code } })
      if (!exists) return code
    }
    // fallback: uuid slice
    for (let i = 0; i < 20; i++) {
      const code = uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase()
      const exists = await this.prisma.eventTicket.findUnique({ where: { backupCode: code } })
      if (!exists) return code
    }
    throw new BadRequestException('Falha ao gerar backupCode único.')
  }

  private async checkOwnerOrAdmin(eventId: string, userId: string, isAdmin: boolean) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } })
    if (!event) throw new NotFoundException('Evento não encontrado.')
    if (event.organizerId !== userId && !isAdmin) throw new ForbiddenException('Sem permissão.')
    return event
  }

  // ────────────────────────────────────────────────────────────────
  // Events CRUD
  // ────────────────────────────────────────────────────────────────

  async create(
    userId: string,
    isAdmin: boolean,
    data: {
      title: string
      description: string
      coverImage?: string
      images?: string[]
      category: string
      type?: string
      city: string
      state: string
      address?: string
      venue?: string
      lat?: number
      lng?: number
      startDate: string
      endDate?: string
      startTime?: string
      organizerName?: string
      socialLinks?: any
      maxAttendees?: number
    },
  ) {
    const type = (data.type ?? 'comum').toLowerCase()
    if (!['oficial', 'destaque', 'comum'].includes(type)) {
      throw new BadRequestException('type deve ser oficial, destaque ou comum.')
    }
    if (type === 'oficial' && !isAdmin) {
      throw new ForbiddenException('Apenas administradores podem criar eventos do tipo oficial.')
    }

    // validate startTime format if provided
    if (data.startTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(data.startTime)) {
      throw new BadRequestException('startTime deve estar no formato HH:mm (ex: 14:00).')
    }

    const startDate = new Date(data.startDate)
    if (isNaN(startDate.getTime())) throw new BadRequestException('startDate inválido.')

    let endDate: Date | null = null
    if (data.endDate) {
      endDate = new Date(data.endDate)
      if (isNaN(endDate.getTime())) throw new BadRequestException('endDate inválido.')
    }

    // status handling for destaque: requires payment -> create with pending? Spec says "set featuredPaid false until payment confirmed, but allow creation with status pending"
    // We'll set status to 'pending' if destaque until payment, otherwise 'active' by default?
    // spec says status default active, but for destaque pending until paid.
    // Let's mimic: destaque -> status pending, isFeatured false, featuredPaid false
    // For others -> active
    const isDestaque = type === 'destaque'
    const status = isDestaque ? 'pending' : 'active'

    const event = await this.prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        coverImage: data.coverImage,
        images: data.images ?? [],
        category: data.category.toLowerCase(),
        type,
        city: data.city,
        state: data.state,
        address: data.address,
        venue: data.venue,
        lat: data.lat,
        lng: data.lng,
        startDate,
        endDate,
        startTime: data.startTime,
        organizerId: userId,
        organizerName: data.organizerName,
        socialLinks: data.socialLinks,
        status,
        isFeatured: false,
        featuredPaid: false,
        maxAttendees: data.maxAttendees,
        viewCount: 0,
      },
      include: { organizer: { select: { id: true, name: true, avatar: true, isVerified: true } } },
    })

    // If destaque, create Payment for featured (99.90)
    let featuredPayment: any = null
    if (isDestaque) {
      try {
        featuredPayment = await this.asaasService.createPayment({
          userId,
          module: 'featured_event',
          referenceId: event.id,
          amount: FEATURED_PRICE,
          method: 'pix', // default pix; can be overwritten via /featured/pay later
        })
      } catch (e) {
        // leave event created but payment failed; log?
        // we keep pending state
      }
    }

    return { event, featuredPayment }
  }

  async findAll(params: {
    q?: string
    category?: string
    type?: string
    city?: string
    state?: string
    status?: string
    isFeatured?: boolean
    startDateFrom?: string
    startDateTo?: string
    organizerId?: string
    page?: number
    limit?: number
    sortBy?: string
  }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 20, 50)
    const skip = (page - 1) * limit

    const where: any = {}

    // default status active for public unless explicitly requested (admin uses status=all)
    if (params.status !== undefined && params.status !== null && params.status !== '') {
      if (params.status !== 'all') where.status = params.status
    } else {
      where.status = 'active'
    }

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    if (params.category) where.category = params.category.toLowerCase()
    if (params.type) where.type = params.type.toLowerCase()
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' }
    if (params.state) where.state = params.state
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured
    if (params.organizerId) where.organizerId = params.organizerId

    if (params.startDateFrom || params.startDateTo) {
      where.startDate = {}
      if (params.startDateFrom) {
        const d = new Date(params.startDateFrom)
        if (!isNaN(d.getTime())) where.startDate.gte = d
      }
      if (params.startDateTo) {
        const d = new Date(params.startDateTo)
        if (!isNaN(d.getTime())) where.startDate.lte = d
      }
    }

    const orderBy =
      params.sortBy === 'newest'
        ? { createdAt: 'desc' as const }
        : params.sortBy === 'startDate'
          ? { startDate: 'asc' as const }
          : [{ isFeatured: 'desc' as const }, { startDate: 'asc' as const }]

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          organizer: { select: { id: true, name: true, avatar: true, isVerified: true } },
          ticketTypes: true,
        },
      }),
      this.prisma.event.count({ where }),
    ])

    const enriched = data.map((ev) => ({
      ...ev,
      ticketTypes: (ev.ticketTypes as any[]).map((tt) => ({
        ...tt,
        remaining: Math.max(0, tt.quantity - tt.sold),
      })),
    }))

    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true } },
        ticketTypes: true,
      },
    })
    if (!event) throw new NotFoundException('Evento não encontrado.')

    await this.prisma.event.update({ where: { id }, data: { viewCount: { increment: 1 } } })

    const enriched = {
      ...event,
      viewCount: event.viewCount + 1,
      ticketTypes: (event.ticketTypes as any[]).map((tt) => ({
        ...tt,
        remaining: Math.max(0, tt.quantity - tt.sold),
      })),
    }

    return enriched
  }

  async update(
    id: string,
    userId: string,
    isAdmin: boolean,
    data: Partial<{
      title: string
      description: string
      coverImage: string
      images: string[]
      category: string
      type: string
      city: string
      state: string
      address: string
      venue: string
      lat: number
      lng: number
      startDate: string
      endDate: string
      startTime: string
      organizerName: string
      socialLinks: any
      maxAttendees: number
    }>,
  ) {
    const event = await this.checkOwnerOrAdmin(id, userId, isAdmin)

    // if changing type to oficial, only admin
    if (data.type && data.type !== event.type) {
      const newType = data.type.toLowerCase()
      if (!['oficial', 'destaque', 'comum'].includes(newType))
        throw new BadRequestException('type inválido.')
      if (newType === 'oficial' && !isAdmin)
        throw new ForbiddenException('Apenas admin pode tornar evento oficial.')
      // if changing to destaque, need featured payment logic
      // For now, if moving to destaque and not yet featuredPaid, set pending?
    }

    if (data.startTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(data.startTime)) {
      throw new BadRequestException('startTime deve ser HH:mm')
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage
    if (data.images !== undefined) updateData.images = data.images
    if (data.category !== undefined) updateData.category = data.category.toLowerCase()
    if (data.type !== undefined) updateData.type = data.type.toLowerCase()
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.address !== undefined) updateData.address = data.address
    if (data.venue !== undefined) updateData.venue = data.venue
    if (data.lat !== undefined) updateData.lat = data.lat
    if (data.lng !== undefined) updateData.lng = data.lng
    if (data.startDate !== undefined) {
      const d = new Date(data.startDate)
      if (isNaN(d.getTime())) throw new BadRequestException('startDate inválido')
      updateData.startDate = d
    }
    if (data.endDate !== undefined) {
      if (data.endDate === null || (data.endDate as any) === '') updateData.endDate = null
      else {
        const d = new Date(data.endDate)
        if (isNaN(d.getTime())) throw new BadRequestException('endDate inválido')
        updateData.endDate = d
      }
    }
    if (data.startTime !== undefined) updateData.startTime = data.startTime
    if (data.organizerName !== undefined) updateData.organizerName = data.organizerName
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks
    if (data.maxAttendees !== undefined) updateData.maxAttendees = data.maxAttendees

    // handle type change to destaque: if event was comum and becomes destaque, mark pending and create payment?
    // We will do: if new type destaque and current not featuredPaid, set status pending if not already active? Actually keep logic simple.

    return this.prisma.event.update({ where: { id }, data: updateData })
  }

  async delete(id: string, userId: string, isAdmin: boolean) {
    const event = await this.checkOwnerOrAdmin(id, userId, isAdmin)
    // cascade deletes ticketTypes, orders, tickets via prisma? TicketType will cascade, but safer to delete
    await this.prisma.event.delete({ where: { id } })
    return { deleted: true }
  }

  async mine(userId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where: { organizerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          ticketTypes: true,
          _count: { select: { orders: true, tickets: true } },
        },
      }),
      this.prisma.event.count({ where: { organizerId: userId } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async adminAll(params: {
    q?: string
    status?: string
    type?: string
    category?: string
    page?: number
    limit?: number
  }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 20, 50)
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ]
    }
    if (params.status && params.status !== 'all') where.status = params.status
    if (params.type) where.type = params.type
    if (params.category) where.category = params.category

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          organizer: { select: { id: true, name: true, avatar: true } },
          ticketTypes: { select: { id: true, name: true, quantity: true, sold: true } },
        },
      }),
      this.prisma.event.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async pending(params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const where = { status: 'moderation' }
    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { organizer: { select: { id: true, name: true, avatar: true } } },
      }),
      this.prisma.event.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateStatus(id: string, status: string, isAdmin: boolean) {
    if (!isAdmin) throw new ForbiddenException('Apenas admin.')
    const allowed = ['draft', 'active', 'cancelled', 'moderation', 'pending']
    if (!allowed.includes(status)) throw new BadRequestException(`Status inválido. Permitidos: ${allowed.join(', ')}`)
    const event = await this.prisma.event.findUnique({ where: { id } })
    if (!event) throw new NotFoundException('Evento não encontrado.')
    return this.prisma.event.update({ where: { id }, data: { status } })
  }

  // ────────────────────────────────────────────────────────────────
  // TicketTypes
  // ────────────────────────────────────────────────────────────────

  async createTicketType(
    eventId: string,
    userId: string,
    isAdmin: boolean,
    data: {
      name: string
      description?: string
      price: number
      quantity: number
      maxPerUser?: number
      salesStart?: string
      salesEnd?: string
      requiresInfo?: any
      status?: string
    },
  ) {
    const event = await this.checkOwnerOrAdmin(eventId, userId, isAdmin)

    let salesStart: Date | null = null
    let salesEnd: Date | null = null
    if (data.salesStart) {
      salesStart = new Date(data.salesStart)
      if (isNaN(salesStart.getTime())) throw new BadRequestException('salesStart inválido')
    }
    if (data.salesEnd) {
      salesEnd = new Date(data.salesEnd)
      if (isNaN(salesEnd.getTime())) throw new BadRequestException('salesEnd inválido')
    }
    if (salesStart && salesEnd && salesStart > salesEnd)
      throw new BadRequestException('salesStart deve ser antes de salesEnd.')

    return this.prisma.ticketType.create({
      data: {
        eventId,
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
        maxPerUser: data.maxPerUser ?? 5,
        salesStart,
        salesEnd,
        requiresInfo: data.requiresInfo,
        status: data.status ?? 'active',
        sold: 0,
      },
    })
  }

  async listTicketTypes(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } })
    if (!event) throw new NotFoundException('Evento não encontrado.')
    const types = await this.prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    })
    return types.map((tt) => ({
      ...tt,
      remaining: Math.max(0, tt.quantity - tt.sold),
    }))
  }

  async updateTicketType(
    eventId: string,
    ticketTypeId: string,
    userId: string,
    isAdmin: boolean,
    data: Partial<{
      name: string
      description: string
      price: number
      quantity: number
      maxPerUser: number
      salesStart: string
      salesEnd: string
      requiresInfo: any
      status: string
    }>,
  ) {
    await this.checkOwnerOrAdmin(eventId, userId, isAdmin)
    const tt = await this.prisma.ticketType.findFirst({ where: { id: ticketTypeId, eventId } })
    if (!tt) throw new NotFoundException('Tipo de ingresso não encontrado.')

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.price !== undefined) updateData.price = data.price
    if (data.quantity !== undefined) {
      if (data.quantity < tt.sold) throw new BadRequestException(`quantity não pode ser menor que sold (${tt.sold}).`)
      updateData.quantity = data.quantity
    }
    if (data.maxPerUser !== undefined) updateData.maxPerUser = data.maxPerUser
    if (data.salesStart !== undefined) {
      if (data.salesStart === null || (data.salesStart as any) === '') updateData.salesStart = null
      else {
        const d = new Date(data.salesStart)
        if (isNaN(d.getTime())) throw new BadRequestException('salesStart inválido')
        updateData.salesStart = d
      }
    }
    if (data.salesEnd !== undefined) {
      if (data.salesEnd === null || (data.salesEnd as any) === '') updateData.salesEnd = null
      else {
        const d = new Date(data.salesEnd)
        if (isNaN(d.getTime())) throw new BadRequestException('salesEnd inválido')
        updateData.salesEnd = d
      }
    }
    // validate window after update
    const newStart = updateData.salesStart !== undefined ? updateData.salesStart : tt.salesStart
    const newEnd = updateData.salesEnd !== undefined ? updateData.salesEnd : tt.salesEnd
    if (newStart && newEnd && newStart > newEnd) throw new BadRequestException('salesStart deve ser antes de salesEnd.')

    if (data.requiresInfo !== undefined) updateData.requiresInfo = data.requiresInfo
    if (data.status !== undefined) {
      if (!['active', 'sold_out', 'paused'].includes(data.status)) throw new BadRequestException('status inválido')
      updateData.status = data.status
    }

    return this.prisma.ticketType.update({ where: { id: ticketTypeId }, data: updateData })
  }

  async deleteTicketType(eventId: string, ticketTypeId: string, userId: string, isAdmin: boolean) {
    await this.checkOwnerOrAdmin(eventId, userId, isAdmin)
    const tt = await this.prisma.ticketType.findFirst({ where: { id: ticketTypeId, eventId } })
    if (!tt) throw new NotFoundException('Tipo de ingresso não encontrado.')
    if (tt.sold > 0) throw new BadRequestException('Não é possível deletar tipo de ingresso com vendas já realizadas.')
    await this.prisma.ticketType.delete({ where: { id: ticketTypeId } })
    return { deleted: true }
  }

  // ────────────────────────────────────────────────────────────────
  // Orders
  // ────────────────────────────────────────────────────────────────

  async createOrder(
    eventId: string,
    buyerId: string,
    data: {
      items: { ticketTypeId: string; quantity: number; attendeeInfo?: any[] }[]
      buyerInfo?: any
      paymentMethod?: string
    },
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    })
    if (!event) throw new NotFoundException('Evento não encontrado.')
    if (event.status !== 'active' && event.status !== 'pending') {
      // pending destaque still allow? If pending for destaque, should still allow orders? But typically only active allowed.
      // For now, only block if cancelled/draft/moderation
      if (['cancelled', 'draft', 'moderation'].includes(event.status))
        throw new BadRequestException(`Evento não está ativo (status: ${event.status}).`)
    }

    if (!data.items || data.items.length === 0) throw new BadRequestException('items é obrigatório.')

    const method = (data.paymentMethod ?? 'pix').toLowerCase()
    if (!['pix', 'card', 'free'].includes(method)) throw new BadRequestException('paymentMethod deve ser pix, card ou free.')

    // Validate ticketTypes belong to event, quantity checks, sales window, status
    const ticketMap = new Map(event.ticketTypes.map((tt) => [tt.id, tt]))
    let totalAmount = 0

    for (const item of data.items) {
      const tt = ticketMap.get(item.ticketTypeId)
      if (!tt) throw new BadRequestException(`TicketType ${item.ticketTypeId} não pertence ao evento.`)
      if (tt.eventId !== eventId) throw new BadRequestException(`TicketType ${item.ticketTypeId} inválido.`)
      if (tt.status !== 'active') throw new BadRequestException(`Ingresso "${tt.name}" não está ativo (status: ${tt.status}).`)
      if (item.quantity <= 0) throw new BadRequestException('quantity deve ser >= 1')
      if (item.quantity > tt.maxPerUser)
        throw new BadRequestException(`Quantidade excede maxPerUser (${tt.maxPerUser}) para "${tt.name}".`)

      const remaining = tt.quantity - tt.sold
      if (item.quantity > remaining) throw new BadRequestException(`Ingresso "${tt.name}" possui apenas ${remaining} restantes.`)

      const now = new Date()
      if (tt.salesStart && now < new Date(tt.salesStart))
        throw new BadRequestException(`Vendas para "${tt.name}" ainda não iniciaram.`)
      if (tt.salesEnd && now > new Date(tt.salesEnd))
        throw new BadRequestException(`Vendas para "${tt.name}" já encerradas.`)

      // attendeeInfo validation: if requiresInfo? just check count matches quantity if provided
      if (item.attendeeInfo && item.attendeeInfo.length !== item.quantity) {
        throw new BadRequestException(
          `attendeeInfo deve ter exatamente ${item.quantity} entradas para "${tt.name}".`,
        )
      }

      // also check if maxAttendees would exceed? Optional: count total tickets sold + requested <= maxAttendees
      if (event.maxAttendees) {
        const totalSold = await this.prisma.eventTicket.count({ where: { eventId, status: { not: 'cancelled' } } })
        const requestedTotal = data.items.reduce((sum, it) => sum + it.quantity, 0)
        if (totalSold + requestedTotal > event.maxAttendees) {
          throw new BadRequestException(`Evento atingiria limite máximo de participantes (${event.maxAttendees}).`)
        }
      }

      totalAmount += tt.price * item.quantity
    }

    totalAmount = Number(totalAmount.toFixed(2))

    // Determine if free
    const isFree = totalAmount === 0
    const finalMethod = isFree ? 'free' : method
    if (isFree && method !== 'free' && method !== 'pix' && method !== 'card') {
      // free still handled as free method
    }
    if (!isFree && finalMethod === 'free') throw new BadRequestException('paymentMethod free só permitido para total 0.')

    // commission via CommissionService.getRate('eventos')
    const commissionRate = await this.commissionService.getRate('eventos')
    const commissionAmount = Number(((totalAmount * commissionRate) / 100).toFixed(2))

    // Create Payment via AsaasService module=eventos (if total 0 then free) -> else pending/paid via pix/card
    // If total 0 then method free, createPayment will mark as paid
    // Create EventOrder + EventOrderItems + EventTicket generation.

    // To guarantee atomicity, use transaction
    // Need to increment TicketType.sold and create tickets with unique codes

    const orderId = uuidv4()

    // Generate tickets upfront: for each item, create quantity tickets
    // Ensure backupCode uniqueness per ticket
    const ticketsToCreate: {
      orderId: string
      eventId: string
      ticketTypeId: string
      holderName?: string
      holderEmail?: string
      holderId?: string
      qrCode: string
      backupCode: string
      status: string
    }[] = []

    // Pre-generate unique codes
    for (const item of data.items) {
      for (let i = 0; i < item.quantity; i++) {
        const qrCode = uuidv4()
        const backupCode = await this.ensureUniqueBackupCode()
        // extract holder info per ticket if attendeeInfo provided
        let holderName: string | undefined
        let holderEmail: string | undefined
        if (item.attendeeInfo && item.attendeeInfo[i]) {
          holderName = item.attendeeInfo[i].nome ?? item.attendeeInfo[i].name
          holderEmail = item.attendeeInfo[i].email
        }
        ticketsToCreate.push({
          orderId,
          eventId,
          ticketTypeId: item.ticketTypeId,
          holderName,
          holderEmail,
          qrCode,
          backupCode,
          status: 'valid',
        })
      }
    }

    // Create order + items + tickets transactionally
    const result = await this.prisma.$transaction(async (tx) => {
      // Re-validate sold within transaction (optimistic lock): fetch latest ticketTypes
      for (const item of data.items) {
        const fresh = await tx.ticketType.findUnique({ where: { id: item.ticketTypeId } })
        if (!fresh) throw new NotFoundException(`TicketType ${item.ticketTypeId} não encontrado.`)
        const remain = fresh.quantity - fresh.sold
        if (item.quantity > remain) throw new BadRequestException(`Ingresso "${fresh.name}" ficou sem estoque (restam ${remain}).`)
      }

      const order = await tx.eventOrder.create({
        data: {
          id: orderId,
          eventId,
          buyerId,
          totalAmount,
          commissionAmount,
          status: isFree ? 'paid' : 'pending',
          paymentStatus: isFree ? 'paid' : 'pending',
          paymentMethod: finalMethod,
          buyerInfo: data.buyerInfo,
        },
      })

      // Create EventOrderItems
      for (const item of data.items) {
        const tt = ticketMap.get(item.ticketTypeId)!
        await tx.eventOrderItem.create({
          data: {
            orderId: order.id,
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPrice: tt.price,
            attendeeInfo: item.attendeeInfo ?? null,
          },
        })
        // increment sold
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { sold: { increment: item.quantity } },
        })
        // if sold reached quantity, mark sold_out?
        const after = await tx.ticketType.findUnique({ where: { id: item.ticketTypeId } })
        if (after && after.sold >= after.quantity) {
          await tx.ticketType.update({ where: { id: item.ticketTypeId }, data: { status: 'sold_out' } })
        }
      }

      // Create tickets
      for (const t of ticketsToCreate) {
        await tx.eventTicket.create({
          data: {
            orderId: t.orderId,
            eventId: t.eventId,
            ticketTypeId: t.ticketTypeId,
            holderName: t.holderName,
            holderEmail: t.holderEmail,
            holderId: null,
            qrCode: t.qrCode,
            backupCode: t.backupCode,
            status: t.status,
          },
        })
      }

      // Create Payment
      let payment: any = null
      if (isFree) {
        payment = await tx.payment.create({
          data: {
            userId: buyerId,
            module: 'eventos',
            referenceId: order.id,
            amount: totalAmount,
            commissionAmount,
            netAmount: Number((totalAmount - commissionAmount).toFixed(2)),
            status: 'paid',
            method: 'free',
            asaasId: `free_${uuidv4()}`,
            asaasStatus: 'RECEIVED',
            paidAt: new Date(),
          },
        })
      } else {
        // Use AsaasService logic manually within transaction to keep netAmount consistent?
        // Simulate AsaasService.createPayment but using tx
        const rate = commissionRate
        const comm = Number(((totalAmount * rate) / 100).toFixed(2))
        const net = Number((totalAmount - comm).toFixed(2))
        const asaasId = `asaas_mock_${uuidv4()}`
        const isPix = finalMethod === 'pix'
        let pixQrCode: string | null = null
        let pixCopyPaste: string | null = null
        if (isPix) {
          const fakeId = uuidv4().replace(/-/g, '').substring(0, 25)
          const amountStr = totalAmount.toFixed(2)
          pixQrCode = `00020126580014BR.GOV.BCB.PIX0136asaas-mock-${fakeId}520400005303986540${amountStr}5802BR5925KITE360 MARKETPLACE6009SAO PAULO62070503***6304${uuidv4().substring(0, 4).toUpperCase()}`
          pixCopyPaste = `00020126580014BR.GOV.BCB.PIX0136asaas-mock-${fakeId}520400005303986540${amountStr}5802BR5925KITE360 PIX6009SAO PAULO62070503***6304${uuidv4().substring(0, 4).toUpperCase()}`
        }
        payment = await tx.payment.create({
          data: {
            userId: buyerId,
            module: 'eventos',
            referenceId: order.id,
            amount: totalAmount,
            commissionAmount: comm,
            netAmount: net,
            status: 'pending',
            method: finalMethod,
            asaasId,
            asaasStatus: 'PENDING',
            pixQrCode,
            pixCopyPaste,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        })
      }

      // Attach paymentId to order
      const updatedOrder = await tx.eventOrder.update({
        where: { id: order.id },
        data: { paymentId: payment.id },
        include: { items: true, tickets: true },
      })

      return { order: updatedOrder, payment, tickets: ticketsToCreate }
    })

    return result
  }

  async listMyOrders(buyerId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.eventOrder.findMany({
        where: { buyerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          event: { select: { id: true, title: true, coverImage: true, startDate: true, city: true, state: true, status: true } },
          items: { include: { ticketType: true } },
          tickets: true,
        },
      }),
      this.prisma.eventOrder.count({ where: { buyerId } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async listEventOrders(eventId: string, userId: string, isAdmin: boolean, params?: { page?: number; limit?: number }) {
    await this.checkOwnerOrAdmin(eventId, userId, isAdmin)
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.eventOrder.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          buyer: { select: { id: true, name: true, email: true, avatar: true } },
          items: { include: { ticketType: true } },
          tickets: true,
        },
      }),
      this.prisma.eventOrder.count({ where: { eventId } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOrderById(orderId: string, userId: string, isAdmin: boolean) {
    const order = await this.prisma.eventOrder.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        buyer: { select: { id: true, name: true, email: true } },
        items: { include: { ticketType: true } },
        tickets: { include: { ticketType: true } },
      },
    })
    if (!order) throw new NotFoundException('Pedido não encontrado.')
    const isBuyer = order.buyerId === userId
    const isOrganizer = order.event.organizerId === userId
    if (!isBuyer && !isOrganizer && !isAdmin) throw new ForbiddenException('Sem permissão para ver este pedido.')
    return order
  }

  // ────────────────────────────────────────────────────────────────
  // Tickets / Check-in
  // ────────────────────────────────────────────────────────────────

  async listTickets(eventId: string, userId: string, isAdmin: boolean, params?: { page?: number; limit?: number; status?: string }) {
    await this.checkOwnerOrAdmin(eventId, userId, isAdmin)
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 100, 100)
    const skip = (page - 1) * limit
    const where: any = { eventId }
    if (params?.status) where.status = params.status
    const [data, total] = await Promise.all([
      this.prisma.eventTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          ticketType: true,
          order: { select: { id: true, buyerId: true, buyerInfo: true, paymentStatus: true } },
          holder: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.eventTicket.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async checkin(
    data: { qrCode?: string; backupCode?: string },
    staffUserId: string,
    isAdmin: boolean,
  ) {
    if (!data.qrCode && !data.backupCode) throw new BadRequestException('Informe qrCode ou backupCode.')
    // Normalize backupCode uppercase?
    let ticket: any
    if (data.qrCode) {
      ticket = await this.prisma.eventTicket.findUnique({
        where: { qrCode: data.qrCode },
        include: { event: true, ticketType: true },
      })
    } else {
      const code = data.backupCode!.toUpperCase().trim()
      ticket = await this.prisma.eventTicket.findUnique({
        where: { backupCode: code },
        include: { event: true, ticketType: true },
      })
    }
    if (!ticket) throw new NotFoundException('Ingresso não encontrado.')

    // verify organizer/admin
    if (ticket.event.organizerId !== staffUserId && !isAdmin)
      throw new ForbiddenException('Apenas organizador ou admin pode fazer check-in deste evento.')

    if (ticket.status === 'cancelled') throw new BadRequestException('Ingresso cancelado.')
    if (ticket.status === 'used') throw new BadRequestException('Ingresso já utilizado.')

    // validate status valid
    if (ticket.status !== 'valid') throw new BadRequestException(`Ingresso com status inválido: ${ticket.status}`)

    const updated = await this.prisma.eventTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'used',
        checkedInAt: new Date(),
        checkedInBy: staffUserId,
      },
      include: { event: { select: { id: true, title: true } }, ticketType: true },
    })

    return { success: true, ticket: updated }
  }

  // ────────────────────────────────────────────────────────────────
  // Featured payment
  // ────────────────────────────────────────────────────────────────

  async featuredPay(eventId: string, userId: string, isAdmin: boolean, method?: string) {
    const event = await this.checkOwnerOrAdmin(eventId, userId, isAdmin)
    // If already featured and featuredExpiresAt still valid, maybe extend?
    // Allow creation regardless

    const payMethod = (method ?? 'pix').toLowerCase()
    if (!['pix', 'card'].includes(payMethod)) throw new BadRequestException('method deve ser pix ou card')

    const payment = await this.asaasService.createPayment({
      userId,
      module: 'featured_event',
      referenceId: event.id,
      amount: FEATURED_PRICE,
      method: payMethod,
    })

    return payment
  }

  // Called when payment for featured_event is confirmed (via webhook or manual confirm). We expose helper
  async confirmFeaturedPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) throw new NotFoundException('Pagamento não encontrado.')
    if (payment.module !== 'featured_event') throw new BadRequestException('Payment module não é featured_event')
    // confirm
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'paid', asaasStatus: 'RECEIVED', paidAt: new Date() },
    })
    // update event isFeatured true, featuredPaid true, featuredExpiresAt +30 days, status active
    const eventId = payment.referenceId
    const now = new Date()
    const expiresAt = new Date(now.getTime() + FEATURED_DURATION_DAYS * 24 * 60 * 60 * 1000)
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        isFeatured: true,
        featuredPaid: true,
        featuredExpiresAt: expiresAt,
        status: 'active',
      },
    })
    return { payment, event }
  }

  // Alternative helper to handle webhook for eventos orders or featured
  async handlePaymentConfirmation(paymentId: string) {
    const payment = await this.asaasService.confirmPayment(paymentId)
    // if eventos, update order status
    if (payment.module === 'eventos') {
      await this.prisma.eventOrder.updateMany({
        where: { paymentId: payment.id },
        data: { status: 'paid', paymentStatus: 'paid' },
      })
    }
    if (payment.module === 'featured_event') {
      await this.confirmFeaturedPayment(payment.id)
    }
    return payment
  }
}
