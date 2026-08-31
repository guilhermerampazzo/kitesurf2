import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common'
import { ServicesOfferingService } from './services-offering.service'
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { CurrentUser } from '../common/decorators/user.decorator'
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsBoolean,
  IsArray,
  IsIn,
  IsDateString,
  Min,
  MaxLength,
  IsEmail,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

// ── DTOs ────────────────────────────────────────────────────────────────────

class CreateServiceOfferingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @IsString()
  @IsIn(['fotografia', 'video', 'manutencao', 'design', 'aula', 'consultoria', 'outro'])
  category!: string

  @IsString()
  @IsIn(['fixed', 'hourly', 'daily'])
  pricingType!: string

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  price!: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minHours?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxHours?: number

  @IsString()
  @IsNotEmpty()
  city!: string

  @IsString()
  @IsNotEmpty()
  state!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]
}

class UpdateServiceOfferingDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  @IsIn(['fotografia', 'video', 'manutencao', 'design', 'aula', 'consultoria', 'outro'])
  category?: string

  @IsOptional()
  @IsString()
  @IsIn(['fixed', 'hourly', 'daily'])
  pricingType?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  price?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minHours?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxHours?: number

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  state?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsOptional()
  @IsString()
  @IsIn(['active', 'paused', 'moderation'])
  status?: string

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isFeatured?: boolean
}

class CreateOrderDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity!: number

  @IsOptional()
  @IsDateString()
  scheduledDate?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsString()
  @IsIn(['pix', 'card', 'free'])
  paymentMethod?: string
}

class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'])
  status!: string
}

class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['active', 'paused', 'moderation'])
  status!: string
}

class UpdateFeaturedDto {
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isFeatured!: boolean
}

@Controller('services')
export class ServicesOfferingController {
  constructor(private readonly services: ServicesOfferingService) {}

  // ── Public listing (with filters) ─────────────────────────────────────
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('pricingType') pricingType?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('sellerId') sellerId?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.services.findAll({
      q,
      category,
      pricingType,
      city,
      state,
      status,
      sellerId,
      sortBy,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  // ── Admin routes (before :id) ──────────────────────────────────────────
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminAll(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('pricingType') pricingType?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('sellerId') sellerId?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.services.adminFindAll({
      q,
      category,
      pricingType,
      city,
      state,
      status,
      sellerId,
      sortBy,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.services.adminListOrders({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
    })
  }

  // ── Buyer/Seller order lists (before :id) ──────────────────────────────
  @Get('orders/mine')
  @UseGuards(JwtAuthGuard)
  myOrders(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.services.listMyOrders(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('orders/received')
  @UseGuards(JwtAuthGuard)
  receivedOrders(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.services.listReceivedOrders(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  findOrderById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    return this.services.findOrderById(id, user.id, !!user.isAdmin)
  }

  @Put('orders/:id/status')
  @UseGuards(JwtAuthGuard)
  updateOrderStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateOrderStatusDto,
  ) {
    if (!body?.status) throw new BadRequestException('status é obrigatório')
    return this.services.updateOrderStatus(id, user, body.status)
  }

  // ── Mine ────────────────────────────────────────────────────────────────
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.services.mine(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  // ── Single service ────────────────────────────────────────────────────
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.services.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: CreateServiceOfferingDto) {
    return this.services.create(user.id, {
      title: body.title,
      description: body.description,
      category: body.category,
      pricingType: body.pricingType,
      price: Number(body.price),
      minHours: body.minHours !== undefined ? Number(body.minHours) : undefined,
      maxHours: body.maxHours !== undefined ? Number(body.maxHours) : undefined,
      city: body.city,
      state: body.state,
      images: body.images,
    })
  }

  @Post(':id/orders')
  @UseGuards(JwtAuthGuard)
  createOrder(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: CreateOrderDto,
  ) {
    return this.services.createOrder(id, user.id, {
      quantity: Number(body.quantity),
      scheduledDate: body.scheduledDate,
      notes: body.notes,
      paymentMethod: body.paymentMethod,
    })
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    if (!body?.status) throw new BadRequestException('status é obrigatório')
    return this.services.updateStatus(id, body.status)
  }

  @Put(':id/featured')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateFeatured(@Param('id') id: string, @Body() body: UpdateFeaturedDto) {
    if (body?.isFeatured === undefined) throw new BadRequestException('isFeatured é obrigatório')
    return this.services.updateFeatured(id, body.isFeatured)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateServiceOfferingDto,
  ) {
    const data: any = { ...body }
    if (data.price !== undefined) data.price = Number(data.price)
    if (data.minHours !== undefined) data.minHours = Number(data.minHours)
    if (data.maxHours !== undefined) data.maxHours = Number(data.maxHours)
    return this.services.update(id, user.id, data, !!user.isAdmin)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser() user: { id: string; isAdmin?: boolean }) {
    return this.services.delete(id, user.id, !!user.isAdmin)
  }
}
