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

const ALLOWED_TYPES = ['hotel', 'pousada', 'casa_temporada', 'hostel', 'resort', 'chale']
const ALLOWED_STATUSES = ['active', 'paused', 'moderation']
const ALLOWED_BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded']

function normalizeDate(dateStr: string | Date): Date {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) throw new BadRequestException('Data inválida.')
  // normalize to UTC midnight
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function calcNights(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

@Injectable()
export class AccommodationsService {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    private asaasService: AsaasService,
  ) {}

  async findAll(params: {
    q?: string
    type?: string
    city?: string
    state?: string
    guests?: number
    priceMin?: number
    priceMax?: number
    amenities?: string[]
    isFeatured?: boolean
    status?: string
    page?: number
    limit?: number
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
      ]
    }

    if (params.type) where.type = params.type
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' }
    if (params.state) where.state = params.state
    if (params.guests !== undefined) where.maxGuests = { gte: params.guests }
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured
    if (params.amenities && params.amenities.length > 0) {
      where.amenities = { hasSome: params.amenities }
    }

    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      where.pricePerNight = {}
      if (params.priceMin !== undefined) (where.pricePerNight as any).gte = params.priceMin
      if (params.priceMax !== undefined) (where.pricePerNight as any).lte = params.priceMax
    }

    const [data, total] = await Promise.all([
      this.prisma.accommodation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: {
          host: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true } },
        },
      }),
      this.prisma.accommodation.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async adminFindAll(params: {
    q?: string
    type?: string
    city?: string
    state?: string
    guests?: number
    priceMin?: number
    priceMax?: number
    amenities?: string[]
    isFeatured?: boolean
    status?: string
    page?: number
    limit?: number
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
      ]
    }

    if (params.type) where.type = params.type
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' }
    if (params.state) where.state = params.state
    if (params.guests !== undefined) where.maxGuests = { gte: params.guests }
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured
    if (params.amenities && params.amenities.length > 0) {
      where.amenities = { hasSome: params.amenities }
    }

    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      where.pricePerNight = {}
      if (params.priceMin !== undefined) (where.pricePerNight as any).gte = params.priceMin
      if (params.priceMax !== undefined) (where.pricePerNight as any).lte = params.priceMax
    }

    const [data, total] = await Promise.all([
      this.prisma.accommodation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          host: { select: { id: true, name: true, avatar: true, isVerified: true } },
          _count: { select: { bookings: true } },
        },
      }),
      this.prisma.accommodation.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string) {
    const accommodation = await this.prisma.accommodation.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true, avatar: true, isVerified: true, rating: true, reviewCount: true, phone: true, email: true } },
        _count: { select: { bookings: true } },
      },
    })
    if (!accommodation) throw new NotFoundException('Hospedagem não encontrada.')

    await this.prisma.accommodation.update({ where: { id }, data: { viewCount: { increment: 1 } } })

    return { ...accommodation, viewCount: accommodation.viewCount + 1 }
  }

  async create(
    hostId: string,
    data: {
      title: string
      description: string
      type: string
      city: string
      state: string
      address?: string
      lat?: number
      lng?: number
      maxGuests: number
      bedrooms: number
      bathrooms: number
      amenities?: string[]
      images?: string[]
      pricePerNight: number
      cleaningFee?: number
      minNights?: number
      maxNights?: number
      isInstantBook?: boolean
      status?: string
      isFeatured?: boolean
    },
  ) {
    if (!ALLOWED_TYPES.includes(data.type)) {
      throw new BadRequestException(`type deve ser um de: ${ALLOWED_TYPES.join(', ')}`)
    }
    if (data.status && !ALLOWED_STATUSES.includes(data.status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }
    if (!data.title || !data.description || !data.city || !data.state) {
      throw new BadRequestException('title, description, city e state são obrigatórios')
    }
    if (data.maxGuests === undefined || data.maxGuests < 1) throw new BadRequestException('maxGuests deve ser >= 1')
    if (data.bedrooms === undefined || data.bedrooms < 0) throw new BadRequestException('bedrooms inválido')
    if (data.bathrooms === undefined || data.bathrooms < 0) throw new BadRequestException('bathrooms inválido')
    if (data.pricePerNight === undefined || isNaN(data.pricePerNight) || data.pricePerNight < 0)
      throw new BadRequestException('pricePerNight deve ser >= 0')

    return this.prisma.accommodation.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        city: data.city,
        state: data.state,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        maxGuests: data.maxGuests,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        amenities: data.amenities ?? [],
        images: data.images ?? [],
        pricePerNight: data.pricePerNight,
        cleaningFee: data.cleaningFee ?? 0,
        minNights: data.minNights ?? 1,
        maxNights: data.maxNights,
        isInstantBook: data.isInstantBook ?? true,
        hostId,
        status: data.status ?? 'active',
        isFeatured: data.isFeatured ?? false,
      },
      include: {
        host: { select: { id: true, name: true, avatar: true } },
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
      city: string
      state: string
      address: string
      lat: number
      lng: number
      maxGuests: number
      bedrooms: number
      bathrooms: number
      amenities: string[]
      images: string[]
      pricePerNight: number
      cleaningFee: number
      minNights: number
      maxNights: number
      isInstantBook: boolean
      status: string
      isFeatured: boolean
    }>,
    isAdmin = false,
  ) {
    const accommodation = await this.prisma.accommodation.findUnique({ where: { id } })
    if (!accommodation) throw new NotFoundException('Hospedagem não encontrada.')
    if (accommodation.hostId !== userId && !isAdmin) throw new ForbiddenException('Apenas o anfitrião pode editar.')

    if (data.type && !ALLOWED_TYPES.includes(data.type)) {
      throw new BadRequestException(`type deve ser um de: ${ALLOWED_TYPES.join(', ')}`)
    }
    if (data.status && !isAdmin) {
      const ownerAllowed = ['active', 'paused']
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
    delete updateData.hostId

    return this.prisma.accommodation.update({ where: { id }, data: updateData })
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const accommodation = await this.prisma.accommodation.findUnique({ where: { id } })
    if (!accommodation) throw new NotFoundException('Hospedagem não encontrada.')
    if (accommodation.hostId !== userId && !isAdmin) throw new ForbiddenException('Apenas o anfitrião pode remover.')
    return this.prisma.accommodation.delete({ where: { id } })
  }

  async mine(hostId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.accommodation.findMany({
        where: { hostId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { bookings: true } },
        },
      }),
      this.prisma.accommodation.count({ where: { hostId } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateStatus(id: string, status: string) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_STATUSES.join(', ')}`)
    }
    const accommodation = await this.prisma.accommodation.findUnique({ where: { id } })
    if (!accommodation) throw new NotFoundException('Hospedagem não encontrada.')
    return this.prisma.accommodation.update({ where: { id }, data: { status } })
  }

  // ── Blocked Dates ────────────────────────────────────────────────────────
  async getBlockedDates(accommodationId: string) {
    const accommodation = await this.prisma.accommodation.findUnique({ where: { id: accommodationId } })
    if (!accommodation) throw new NotFoundException('Hospedagem não encontrada.')
    return this.prisma.accommodationBlockedDate.findMany({
      where: { accommodationId },
      orderBy: { date: 'asc' },
    })
  }

  async createBlockedDate(accommodationId: string, userId: string, data: { date: string; reason?: string }, isAdmin = false) {
    const accommodation = await this.prisma.accommodation.findUnique({ where: { id: accommodationId } })
    if (!accommodation) throw new NotFoundException('Hospedagem não encontrada.')
    if (accommodation.hostId !== userId && !isAdmin) throw new ForbiddenException('Apenas o anfitrião pode bloquear datas.')

    const normalized = normalizeDate(data.date)

    const existing = await this.prisma.accommodationBlockedDate.findUnique({
      where: { accommodationId_date: { accommodationId, date: normalized } },
    })
    if (existing) throw new ConflictException('Data já está bloqueada.')

    return this.prisma.accommodationBlockedDate.create({
      data: {
        accommodationId,
        date: normalized,
        reason: data.reason,
      },
    })
  }

  async deleteBlockedDate(accommodationId: string, dateId: string, userId: string, isAdmin = false) {
    const accommodation = await this.prisma.accommodation.findUnique({ where: { id: accommodationId } })
    if (!accommodation) throw new NotFoundException('Hospedagem não encontrada.')
    if (accommodation.hostId !== userId && !isAdmin) throw new ForbiddenException('Apenas o anfitrião pode desbloquear datas.')

    const blocked = await this.prisma.accommodationBlockedDate.findUnique({ where: { id: dateId } })
    if (!blocked || blocked.accommodationId !== accommodationId) throw new NotFoundException('Data bloqueada não encontrada.')

    return this.prisma.accommodationBlockedDate.delete({ where: { id: dateId } })
  }

  // ── Availability ──────────────────────────────────────────────────────────
  async checkAvailability(accommodationId: string, checkInStr: string, checkOutStr: string) {
    if (!checkInStr || !checkOutStr) throw new BadRequestException('checkIn e checkOut são obrigatórios. Formato YYYY-MM-DD')
    const checkIn = normalizeDate(checkInStr)
    const checkOut = normalizeDate(checkOutStr)

    if (checkOut.getTime() <= checkIn.getTime()) {
      throw new BadRequestException('checkOut deve ser após checkIn')
    }

    const nights = calcNights(checkIn, checkOut)

    const accommodation = await this.prisma.accommodation.findUnique({ where: { id: accommodationId } })
    if (!accommodation) throw new NotFoundException('Hospedagem não encontrada.')

    if (accommodation.status !== 'active') {
      return { isAvailable: false, nights, reason: `Hospedagem com status ${accommodation.status} não está disponível` }
    }

    if (nights < accommodation.minNights) {
      return { isAvailable: false, nights, reason: `Mínimo de ${accommodation.minNights} noites` }
    }

    if (accommodation.maxNights && nights > accommodation.maxNights) {
      return { isAvailable: false, nights, reason: `Máximo de ${accommodation.maxNights} noites` }
    }

    const overlappingBooking = await this.prisma.accommodationBooking.findFirst({
      where: {
        accommodationId,
        status: { notIn: ['cancelled', 'refunded'] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    })

    if (overlappingBooking) {
      return { isAvailable: false, nights, reason: 'Datas já reservadas', overlappingBookingId: overlappingBooking.id }
    }

    const blocked = await this.prisma.accommodationBlockedDate.findFirst({
      where: {
        accommodationId,
        date: { gte: checkIn, lt: checkOut },
      },
    })

    if (blocked) {
      return { isAvailable: false, nights, reason: 'Datas bloqueadas pelo anfitrião', blockedDate: blocked.date }
    }

    return { isAvailable: true, nights }
  }

  // ── Bookings ──────────────────────────────────────────────────────────────
  async book(
    accommodationId: string,
    userId: string,
    data: {
      checkIn: string
      checkOut: string
      guests: number
      guestName?: string
      guestPhone?: string
      guestEmail?: string
      paymentMethod?: string
    },
  ) {
    const accommodation = await this.prisma.accommodation.findUnique({ where: { id: accommodationId } })
    if (!accommodation) throw new NotFoundException('Hospedagem não encontrada.')
    if (accommodation.status !== 'active') throw new BadRequestException('Hospedagem não está disponível para reserva.')

    if (!data.checkIn || !data.checkOut) throw new BadRequestException('checkIn e checkOut são obrigatórios.')
    const checkIn = normalizeDate(data.checkIn)
    const checkOut = normalizeDate(data.checkOut)
    if (checkOut.getTime() <= checkIn.getTime()) throw new BadRequestException('checkOut deve ser após checkIn')

    const nights = calcNights(checkIn, checkOut)

    if (nights < accommodation.minNights) {
      throw new BadRequestException(`Mínimo de ${accommodation.minNights} noites`)
    }
    if (accommodation.maxNights && nights > accommodation.maxNights) {
      throw new BadRequestException(`Máximo de ${accommodation.maxNights} noites`)
    }

    if (!data.guests || data.guests < 1) throw new BadRequestException('guests deve ser >= 1')
    if (data.guests > accommodation.maxGuests) {
      throw new BadRequestException(`Máximo de ${accommodation.maxGuests} hóspedes`)
    }

    // check availability (bookings + blocked)
    const overlapping = await this.prisma.accommodationBooking.findFirst({
      where: {
        accommodationId,
        status: { notIn: ['cancelled', 'refunded'] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    })
    if (overlapping) throw new BadRequestException('Datas já reservadas.')

    const blocked = await this.prisma.accommodationBlockedDate.findFirst({
      where: { accommodationId, date: { gte: checkIn, lt: checkOut } },
    })
    if (blocked) throw new BadRequestException('Datas bloqueadas pelo anfitrião.')

    const pricePerNight = accommodation.pricePerNight
    const cleaningFee = accommodation.cleaningFee ?? 0
    const totalPrice = Number((nights * pricePerNight + cleaningFee).toFixed(2))

    const rate = await this.commissionService.getRate('hospedagem')
    const commissionAmount = Number(((totalPrice * rate) / 100).toFixed(2))

    const paymentMethod = data.paymentMethod ?? 'pix'
    if (!['pix', 'card', 'free', 'boleto'].includes(paymentMethod)) {
      throw new BadRequestException('paymentMethod deve ser pix, card, boleto ou free')
    }

    const bookingStatus = accommodation.isInstantBook ? 'confirmed' : 'pending'

    // Create booking first without paymentId
    const booking = await this.prisma.accommodationBooking.create({
      data: {
        accommodationId,
        userId,
        checkIn,
        checkOut,
        guests: data.guests,
        nights,
        pricePerNight,
        cleaningFee,
        totalPrice,
        commissionAmount,
        status: bookingStatus,
        paymentStatus: 'pending',
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail,
      },
    })

    // Create payment via AsaasService
    const payment = await this.asaasService.createPayment({
      userId,
      module: 'hospedagem',
      referenceId: booking.id,
      amount: totalPrice,
      method: paymentMethod,
    })

    const paymentStatus = payment.status === 'paid' ? 'paid' : 'pending'

    const updatedBooking = await this.prisma.accommodationBooking.update({
      where: { id: booking.id },
      data: {
        paymentId: payment.id,
        paymentStatus,
      },
      include: {
        accommodation: { select: { id: true, title: true, hostId: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return { booking: updatedBooking, payment }
  }

  async getMyBookings(userId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.accommodationBooking.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          accommodation: {
            include: {
              host: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      }),
      this.prisma.accommodationBooking.count({ where: { userId } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getHostBookings(hostId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const where = { accommodation: { hostId } }
    const [data, total] = await Promise.all([
      this.prisma.accommodationBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          accommodation: { select: { id: true, title: true, city: true, state: true, images: true, pricePerNight: true } },
          user: { select: { id: true, name: true, avatar: true, email: true } },
        },
      }),
      this.prisma.accommodationBooking.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateBookingStatus(
    bookingId: string,
    currentUserId: string,
    isAdmin: boolean,
    newStatus: string,
  ) {
    if (!ALLOWED_BOOKING_STATUSES.includes(newStatus)) {
      throw new BadRequestException(`status deve ser um de: ${ALLOWED_BOOKING_STATUSES.join(', ')}`)
    }
    const booking = await this.prisma.accommodationBooking.findUnique({
      where: { id: bookingId },
      include: { accommodation: true },
    })
    if (!booking) throw new NotFoundException('Reserva não encontrada.')

    const isHost = booking.accommodation.hostId === currentUserId
    const isGuest = booking.userId === currentUserId

    if (!isHost && !isGuest && !isAdmin) throw new ForbiddenException('Sem permissão para alterar esta reserva.')

    // Guest can only cancel
    if (isGuest && !isHost && !isAdmin) {
      if (newStatus !== 'cancelled') {
        throw new ForbiddenException('Hóspede só pode cancelar a reserva.')
      }
      if (['cancelled', 'refunded', 'completed'].includes(booking.status)) {
        throw new BadRequestException(`Reserva já está com status ${booking.status}`)
      }

      // Refund policy: >7 days full refund, 3-7 days 50%, <3 days no refund
      const now = new Date()
      const checkIn = new Date(booking.checkIn)
      const diffMs = checkIn.getTime() - now.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)

      if (diffDays < 0) {
        throw new BadRequestException('Não é possível cancelar reserva já iniciada.')
      }

      let refundType: string = 'none'
      let shouldRefund = false
      let isFullRefund = false

      if (diffDays > 7) {
        shouldRefund = true
        isFullRefund = true
        refundType = 'full'
      } else if (diffDays >= 3) {
        shouldRefund = true
        isFullRefund = false
        refundType = '50%'
      } else {
        shouldRefund = false
        refundType = 'none'
      }

      if (shouldRefund && booking.paymentStatus === 'paid' && booking.paymentId) {
        try {
          await this.asaasService.refundPayment(booking.paymentId)
        } catch {
          // ignore if payment not found
        }
        // For 50% case, we still mark as refunded but could note partial; we keep status refunded or cancelled with refund
        // We'll set paymentStatus to refunded and booking status to cancelled/refunded
        const updated = await this.prisma.accommodationBooking.update({
          where: { id: bookingId },
          data: {
            status: 'cancelled',
            paymentStatus: 'refunded',
          },
        })
        return { ...updated, refundPolicy: refundType, refundAmount: isFullRefund ? booking.totalPrice : Number((booking.totalPrice * 0.5).toFixed(2)) }
      } else if (!shouldRefund && booking.paymentStatus === 'paid') {
        // No refund, just cancel
        const updated = await this.prisma.accommodationBooking.update({
          where: { id: bookingId },
          data: { status: 'cancelled' },
        })
        return { ...updated, refundPolicy: 'none', refundAmount: 0, message: 'Cancelamento sem reembolso (menos de 3 dias)' }
      } else {
        // pending payment, just cancel
        const updated = await this.prisma.accommodationBooking.update({
          where: { id: bookingId },
          data: {
            status: 'cancelled',
            ...(booking.paymentStatus === 'pending' ? { paymentStatus: 'refunded' as any } : {}),
          },
        })
        return { ...updated, refundPolicy: shouldRefund ? 'full' : 'none' }
      }
    }

    // Host or Admin logic
    if (isHost || isAdmin) {
      if (newStatus === 'confirmed') {
        if (booking.status !== 'pending') throw new BadRequestException('Apenas reservas pendentes podem ser confirmadas.')
        return this.prisma.accommodationBooking.update({ where: { id: bookingId }, data: { status: 'confirmed' } })
      }
      if (newStatus === 'cancelled') {
        if (['cancelled', 'refunded', 'completed'].includes(booking.status)) {
          throw new BadRequestException(`Reserva já está com status ${booking.status}`)
        }
        // Host cancel: always full refund if paid
        if (booking.paymentStatus === 'paid' && booking.paymentId) {
          try {
            await this.asaasService.refundPayment(booking.paymentId)
          } catch {}
          return this.prisma.accommodationBooking.update({
            where: { id: bookingId },
            data: { status: 'cancelled', paymentStatus: 'refunded' },
          })
        }
        return this.prisma.accommodationBooking.update({
          where: { id: bookingId },
          data: { status: 'cancelled' },
        })
      }
      if (newStatus === 'completed') {
        if (booking.status !== 'confirmed') throw new BadRequestException('Apenas reservas confirmadas podem ser concluídas.')
        return this.prisma.accommodationBooking.update({ where: { id: bookingId }, data: { status: 'completed' } })
      }
      if (newStatus === 'refunded') {
        if (booking.paymentStatus !== 'paid') throw new BadRequestException('Apenas reservas pagas podem ser reembolsadas.')
        if (booking.paymentId) {
          try {
            await this.asaasService.refundPayment(booking.paymentId)
          } catch {}
        }
        return this.prisma.accommodationBooking.update({
          where: { id: bookingId },
          data: { status: 'refunded', paymentStatus: 'refunded' },
        })
      }
      // generic fallback
      return this.prisma.accommodationBooking.update({ where: { id: bookingId }, data: { status: newStatus } })
    }

    throw new ForbiddenException('Sem permissão.')
  }

  // For admin: list all bookings optionally
  async adminListBookings(params?: { page?: number; limit?: number; status?: string }) {
    const page = params?.page ?? 1
    const limit = Math.min(params?.limit ?? 20, 50)
    const skip = (page - 1) * limit
    const where: Record<string, any> = {}
    if (params?.status && params.status !== 'all') where.status = params.status
    const [data, total] = await Promise.all([
      this.prisma.accommodationBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          accommodation: { select: { id: true, title: true, hostId: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      this.prisma.accommodationBooking.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
