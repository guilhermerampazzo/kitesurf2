import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common'
import { AsaasService } from './asaas.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { CurrentUser } from '../common/decorators/user.decorator'
import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator'

class CreatePaymentDto {
  @IsString()
  module: string

  @IsString()
  referenceId: string

  @IsNumber()
  @Min(0)
  amount: number

  @IsOptional()
  @IsString()
  @IsIn(['pix', 'card', 'boleto', 'free'])
  method?: string
}

class WebhookDto {
  @IsString()
  asaasId: string

  @IsString()
  status: string
}

@Controller('payments')
export class AsaasController {
  constructor(private readonly asaasService: AsaasService) {}

  @Post('webhook/asaas')
  webhook(@Body() body: WebhookDto) {
    return this.asaasService.handleWebhook(body.asaasId, body.status)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: { id: string },
    @Body() body: CreatePaymentDto,
  ) {
    return this.asaasService.createPayment({
      userId: user.id,
      module: body.module,
      referenceId: body.referenceId,
      amount: body.amount,
      method: body.method,
    })
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: { id: string }) {
    return this.asaasService.findByUser(user.id)
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, AdminGuard)
  confirm(@Param('id') id: string) {
    return this.asaasService.confirmPayment(id)
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, AdminGuard)
  refund(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.asaasService.refundPayment(id, body?.reason)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    const payment = await this.asaasService.findOne(id)
    if (payment.userId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Access denied to this payment.')
    }
    return payment
  }
}
