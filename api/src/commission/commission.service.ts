import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.module'

@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.commissionConfig.findMany({
      orderBy: { module: 'asc' },
    })
  }

  async findOne(module: string) {
    const config = await this.prisma.commissionConfig.findUnique({
      where: { module },
    })
    if (!config) throw new NotFoundException(`Commission config for module "${module}" not found.`)
    return config
  }

  async getRate(module: string): Promise<number> {
    const config = await this.prisma.commissionConfig.findUnique({
      where: { module },
    })
    if (!config) return 10
    return config.percentage
  }

  async upsert(module: string, percentage: number, fixedFee: number, isActive?: boolean) {
    if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
      throw new BadRequestException('percentage must be between 0 and 100.')
    }
    if (fixedFee !== undefined && fixedFee < 0) {
      throw new BadRequestException('fixedFee must be >= 0.')
    }

    const data: { percentage?: number; fixedFee?: number; isActive?: boolean } = {}
    if (percentage !== undefined) data.percentage = percentage
    if (fixedFee !== undefined) data.fixedFee = fixedFee
    if (isActive !== undefined) data.isActive = isActive

    return this.prisma.commissionConfig.upsert({
      where: { module },
      create: {
        module,
        percentage: percentage ?? 10,
        fixedFee: fixedFee ?? 0,
        isActive: isActive ?? true,
      },
      update: data,
    })
  }
}
