import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma.module'
import { AsaasService } from '../asaas/asaas.service'

const DEFAULT_FARE = { minFare: 8, pricePerKm: 2.5, pricePerMin: 0.35, cancelFee: 4 }

const RIDE_FINAL = ['completed', 'cancelled']
const RIDE_CHARGED_CANCEL = ['accepted', 'arriving', 'ongoing']
const DRIVER_STATUSES = ['pending', 'approved', 'rejected', 'suspended']

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return 2 * R * Math.asin(Math.sqrt(a))
}

function round2(n: number): number {
  return Number(n.toFixed(2))
}

@Injectable()
export class BuberService {
  constructor(
    private prisma: PrismaService,
    private asaas: AsaasService,
  ) {}

  // Prisma client ainda não tem os models Buber* gerados (outra frente cria o
  // schema); acesso via `any` para não quebrar o build até o `prisma generate`.
  private get db(): any {
    return this.prisma as any
  }

  // ── Tarifa ─────────────────────────────────────────────────────────────
  async getFare() {
    const config = await this.db.buberFareConfig.findFirst({ where: { isActive: true } })
    if (!config) return { ...DEFAULT_FARE, isActive: true }
    return config
  }

  async upsertFare(data: {
    minFare: number
    pricePerKm: number
    pricePerMin: number
    cancelFee?: number
    isActive?: boolean
  }) {
    if (data.minFare < 0 || data.pricePerKm < 0 || data.pricePerMin < 0) {
      throw new BadRequestException('minFare, pricePerKm e pricePerMin devem ser >= 0')
    }
    if (data.cancelFee !== undefined && data.cancelFee < 0) {
      throw new BadRequestException('cancelFee deve ser >= 0')
    }
    const existing = await this.db.buberFareConfig.findFirst({ where: { isActive: true } })
    if (existing) {
      return this.db.buberFareConfig.update({ where: { id: existing.id }, data })
    }
    return this.db.buberFareConfig.create({
      data: {
        minFare: data.minFare,
        pricePerKm: data.pricePerKm,
        pricePerMin: data.pricePerMin,
        cancelFee: data.cancelFee ?? DEFAULT_FARE.cancelFee,
        isActive: data.isActive ?? true,
      },
    })
  }

  // ── Estimativa ─────────────────────────────────────────────────────────
  async estimate(originLat: number, originLng: number, destLat: number, destLng: number) {
    const fare = await this.getFare()
    const distanceKm = round2(haversineKm(originLat, originLng, destLat, destLng))
    const durationMin = round2(distanceKm * 2) // média de 30 km/h
    const price = round2(
      Math.max(fare.minFare, distanceKm * fare.pricePerKm + durationMin * fare.pricePerMin),
    )
    return { distanceKm, durationMin, price }
  }

  // ── Motorista ──────────────────────────────────────────────────────────
  private async requireApprovedDriver(userId: string) {
    const driver = await this.db.buberDriver.findUnique({ where: { userId } })
    if (!driver) throw new ForbiddenException('Perfil de motorista não encontrado.')
    if (driver.status !== 'approved') throw new ForbiddenException('Motorista não aprovado.')
    return driver
  }

  async registerDriver(
    userId: string,
    data: {
      cnh: string
      vehicleModel: string
      vehiclePlate: string
      vehicleColor?: string
      vehicleSeats?: number
    },
  ) {
    return this.db.buberDriver.upsert({
      where: { userId },
      create: {
        userId,
        status: 'pending',
        cnh: data.cnh,
        vehicleModel: data.vehicleModel,
        vehiclePlate: data.vehiclePlate,
        vehicleColor: data.vehicleColor,
        vehicleSeats: data.vehicleSeats ?? 4,
      },
      update: {
        cnh: data.cnh,
        vehicleModel: data.vehicleModel,
        vehiclePlate: data.vehiclePlate,
        vehicleColor: data.vehicleColor,
        vehicleSeats: data.vehicleSeats,
        status: 'pending',
      },
    })
  }

  async updateMe(
    userId: string,
    data: {
      vehicleModel?: string
      vehiclePlate?: string
      vehicleColor?: string
      vehicleSeats?: number
      currentLat?: number
      currentLng?: number
    },
  ) {
    const driver = await this.db.buberDriver.findUnique({ where: { userId } })
    if (!driver) throw new NotFoundException('Perfil de motorista não encontrado.')
    return this.db.buberDriver.update({ where: { userId }, data })
  }

  async setOnline(userId: string, isOnline: boolean, lat?: number, lng?: number) {
    const driver = await this.db.buberDriver.findUnique({ where: { userId } })
    if (!driver) throw new NotFoundException('Perfil de motorista não encontrado.')
    return this.db.buberDriver.update({
      where: { userId },
      data: {
        isOnline,
        ...(lat !== undefined ? { currentLat: lat } : {}),
        ...(lng !== undefined ? { currentLng: lng } : {}),
      },
    })
  }

  // ── Corridas ───────────────────────────────────────────────────────────
  async availableRides() {
    return this.db.buberRide.findMany({
      where: { status: 'requested' },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createRide(
    passengerId: string,
    data: {
      originLabel?: string
      originLat: number
      originLng: number
      destLabel?: string
      destLat: number
      destLng: number
    },
  ) {
    const est = await this.estimate(data.originLat, data.originLng, data.destLat, data.destLng)
    return this.db.buberRide.create({
      data: {
        passengerId,
        originLabel: data.originLabel,
        originLat: data.originLat,
        originLng: data.originLng,
        destLabel: data.destLabel,
        destLat: data.destLat,
        destLng: data.destLng,
        distanceKm: est.distanceKm,
        durationMin: est.durationMin,
        price: est.price,
        status: 'requested',
        cancelFee: 0,
      },
    })
  }

  async myRides(userId: string) {
    const driver = await this.db.buberDriver.findUnique({ where: { userId } })
    const OR: Record<string, unknown>[] = [{ passengerId: userId }]
    if (driver) OR.push({ driverId: driver.id })
    return this.db.buberRide.findMany({ where: { OR }, orderBy: { createdAt: 'desc' } })
  }

  async acceptRide(rideId: string, userId: string) {
    const driver = await this.requireApprovedDriver(userId)
    const ride = await this.db.buberRide.findUnique({ where: { id: rideId } })
    if (!ride) throw new NotFoundException('Corrida não encontrada.')
    if (ride.status !== 'requested') throw new BadRequestException('Corrida não está disponível.')
    return this.db.buberRide.update({
      where: { id: rideId },
      data: { driverId: driver.id, status: 'accepted' },
    })
  }

  async updateRideStatus(rideId: string, userId: string, status: string) {
    const ride = await this.db.buberRide.findUnique({ where: { id: rideId } })
    if (!ride) throw new NotFoundException('Corrida não encontrada.')
    if (RIDE_FINAL.includes(ride.status)) throw new BadRequestException('Corrida já finalizada.')

    const driver = await this.db.buberDriver.findUnique({ where: { userId } })
    const isPassenger = ride.passengerId === userId
    const isDriver = !!driver && ride.driverId === driver.id

    if (status === 'cancelled') {
      if (!isPassenger && !isDriver) {
        throw new ForbiddenException('Sem permissão para cancelar esta corrida.')
      }
      const fare = await this.getFare()
      const charged = RIDE_CHARGED_CANCEL.includes(ride.status)
      return this.db.buberRide.update({
        where: { id: rideId },
        data: { status: 'cancelled', cancelFee: charged ? fare.cancelFee : 0 },
      })
    }

    if (!isDriver) throw new ForbiddenException('Apenas o motorista pode atualizar o status.')

    if (status === 'completed') {
      const payment = await this.asaas.createPayment({
        userId: ride.passengerId,
        module: 'buber',
        referenceId: ride.id,
        amount: Number(ride.price),
        method: 'pix',
      })
      await this.db.buberDriver.update({
        where: { id: driver.id },
        data: { rideCount: { increment: 1 } },
      })
      return this.db.buberRide.update({
        where: { id: rideId },
        data: { status: 'completed', paymentId: payment.id },
      })
    }

    return this.db.buberRide.update({ where: { id: rideId }, data: { status } })
  }

  // ── Trajetos (carona) ──────────────────────────────────────────────────
  async createRoute(
    userId: string,
    data: {
      title: string
      originLabel: string
      destLabel: string
      stops?: string[]
      departsAt: string
      seatsTotal: number
      pricePerSeat: number
    },
  ) {
    const driver = await this.requireApprovedDriver(userId)
    const departsAt = new Date(data.departsAt)
    if (isNaN(departsAt.getTime())) throw new BadRequestException('departsAt inválida.')
    if (departsAt <= new Date()) throw new BadRequestException('departsAt deve ser futura.')
    return this.db.buberRoute.create({
      data: {
        driverId: driver.id,
        title: data.title,
        originLabel: data.originLabel,
        destLabel: data.destLabel,
        stops: data.stops ?? [],
        departsAt,
        seatsTotal: data.seatsTotal,
        seatsTaken: 0,
        pricePerSeat: data.pricePerSeat,
        status: 'active',
      },
    })
  }

  async listRoutes(status?: string) {
    const routes = await this.db.buberRoute.findMany({
      where: { status: status ?? 'active', departsAt: { gt: new Date() } },
      orderBy: { departsAt: 'asc' },
    })
    return routes.filter((r: any) => (r.seatsTaken ?? 0) < r.seatsTotal)
  }

  async bookRoute(routeId: string, passengerId: string, seats: number) {
    if (!Number.isInteger(seats) || seats < 1) {
      throw new BadRequestException('seats deve ser um inteiro >= 1')
    }
    const route = await this.db.buberRoute.findUnique({ where: { id: routeId } })
    if (!route) throw new NotFoundException('Trajeto não encontrado.')
    if (route.status !== 'active') throw new BadRequestException('Trajeto não está ativo.')
    if (new Date(route.departsAt) <= new Date()) throw new BadRequestException('Trajeto já partiu.')
    if ((route.seatsTaken ?? 0) + seats > route.seatsTotal) {
      throw new BadRequestException('Vagas insuficientes.')
    }
    const totalPrice = round2(seats * Number(route.pricePerSeat))
    const booking = await this.db.buberBooking.create({
      data: { routeId, passengerId, seats, totalPrice, status: 'confirmed' },
    })
    const payment = await this.asaas.createPayment({
      userId: passengerId,
      module: 'buber',
      referenceId: booking.id,
      amount: totalPrice,
      method: 'pix',
    })
    await this.db.buberRoute.update({
      where: { id: routeId },
      data: { seatsTaken: { increment: seats } },
    })
    return this.db.buberBooking.update({
      where: { id: booking.id },
      data: { paymentId: payment.id },
    })
  }

  // ── Admin ──────────────────────────────────────────────────────────────
  async listDrivers() {
    return this.db.buberDriver.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async setDriverStatus(id: string, status: string) {
    if (!DRIVER_STATUSES.includes(status)) {
      throw new BadRequestException(`status deve ser um de: ${DRIVER_STATUSES.join(', ')}`)
    }
    const driver = await this.db.buberDriver.findUnique({ where: { id } })
    if (!driver) throw new NotFoundException('Motorista não encontrado.')
    return this.db.buberDriver.update({ where: { id }, data: { status } })
  }
}
