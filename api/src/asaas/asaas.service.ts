import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.module'
import { CommissionService } from '../commission/commission.service'
import { v4 as uuid } from 'uuid'

@Injectable()
export class AsaasService {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
  ) {}

  async createPayment(data: {
    userId: string
    module: string
    referenceId: string
    amount: number
    method?: string
  }) {
    if (!data.module || !data.referenceId) {
      throw new BadRequestException('module and referenceId are required.')
    }
    if (data.amount === undefined || data.amount === null || isNaN(data.amount) || data.amount < 0) {
      throw new BadRequestException('amount must be a positive number.')
    }

    const rate = await this.commissionService.getRate(data.module)
    const commissionAmount = Number(((data.amount * rate) / 100).toFixed(2))
    const netAmount = Number((data.amount - commissionAmount).toFixed(2))

    const isFree = data.method === 'free'
    const isPix = data.method === 'pix'

    const now = new Date()
    const asaasId = `asaas_mock_${uuid()}`
    const status = isFree ? 'paid' : 'pending'
    const asaasStatus = isFree ? 'RECEIVED' : 'PENDING'
    const paidAt = isFree ? now : null
    const dueDate = isFree ? null : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

    let pixQrCode: string | null = null
    let pixCopyPaste: string | null = null

    if (isPix) {
      const fakeId = uuid().replace(/-/g, '').substring(0, 25)
      pixQrCode = `00020126580014BR.GOV.BCB.PIX0136asaas-mock-${fakeId}520400005303986540${data.amount.toFixed(2)}5802BR5925KITE360 MARKETPLACE6009SAO PAULO62070503***6304${uuid().substring(0, 4).toUpperCase()}`
      pixCopyPaste = `00020126580014BR.GOV.BCB.PIX0136asaas-mock-${fakeId}520400005303986540${data.amount.toFixed(2)}5802BR5925KITE360 PIX6009SAO PAULO62070503***6304${uuid().substring(0, 4).toUpperCase()}`
    }

    return this.prisma.payment.create({
      data: {
        userId: data.userId,
        module: data.module,
        referenceId: data.referenceId,
        amount: data.amount,
        commissionAmount,
        netAmount,
        status,
        method: data.method,
        asaasId,
        asaasStatus,
        pixQrCode,
        pixCopyPaste,
        dueDate,
        paidAt,
      },
    })
  }

  async confirmPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) throw new NotFoundException(`Payment "${paymentId}" not found.`)
    if (payment.status === 'paid') return payment

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'paid',
        asaasStatus: 'RECEIVED',
        paidAt: new Date(),
      },
    })
  }

  async refundPayment(paymentId: string, reason?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) throw new NotFoundException(`Payment "${paymentId}" not found.`)
    if (payment.status === 'refunded') return payment

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'refunded',
        asaasStatus: 'REFUNDED',
      },
    })
  }

  async findByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByReference(module: string, referenceId: string) {
    return this.prisma.payment.findMany({
      where: { module, referenceId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } })
    if (!payment) throw new NotFoundException(`Payment "${id}" not found.`)
    return payment
  }

  async handleWebhook(asaasId: string, status: string) {
    const payment = await this.prisma.payment.findFirst({ where: { asaasId } })
    if (!payment) throw new NotFoundException(`Payment with asaasId "${asaasId}" not found.`)

    const normalized = status?.toUpperCase()
    let newStatus: string | undefined
    let paidAt: Date | undefined

    if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'PAID'].includes(normalized)) {
      newStatus = 'paid'
      paidAt = new Date()
    } else if (['REFUNDED', 'REFUND_REQUESTED'].includes(normalized)) {
      newStatus = 'refunded'
    } else if (['OVERDUE', 'PENDING'].includes(normalized)) {
      newStatus = 'pending'
    } else if (['FAILED', 'CANCELLED', 'CANCELED'].includes(normalized)) {
      newStatus = normalized === 'FAILED' ? 'failed' : 'cancelled'
    }

    const data: any = { asaasStatus: status }
    if (newStatus) data.status = newStatus
    if (paidAt) data.paidAt = paidAt

    return this.prisma.payment.update({
      where: { id: payment.id },
      data,
    })
  }
}
