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
import { VehiclesService } from './vehicles.service'
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
  Min,
  Max,
  MaxLength,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @IsString()
  @IsIn(['carro', 'moto', 'lancha', 'jetski', 'quadriciclo', 'trailer'])
  type!: string

  @IsOptional()
  @IsString()
  brand?: string

  @IsOptional()
  @IsString()
  model?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage?: number

  @IsOptional()
  @IsString()
  @IsIn(['gasolina', 'diesel', 'eletrico', 'flex', 'hibrido'])
  fuel?: string

  @IsOptional()
  @IsString()
  @IsIn(['manual', 'automatico', 'cvt'])
  transmission?: string

  @IsOptional()
  @IsString()
  color?: string

  @IsString()
  @IsNotEmpty()
  city!: string

  @IsString()
  @IsNotEmpty()
  state!: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[]

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isFeatured?: boolean

  @IsOptional()
  @IsString()
  @IsIn(['active', 'paused', 'sold', 'moderation'])
  status?: string
}

class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  @IsIn(['carro', 'moto', 'lancha', 'jetski', 'quadriciclo', 'trailer'])
  type?: string

  @IsOptional()
  @IsString()
  brand?: string

  @IsOptional()
  @IsString()
  model?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage?: number

  @IsOptional()
  @IsString()
  @IsIn(['gasolina', 'diesel', 'eletrico', 'flex', 'hibrido'])
  fuel?: string

  @IsOptional()
  @IsString()
  @IsIn(['manual', 'automatico', 'cvt'])
  transmission?: string

  @IsOptional()
  @IsString()
  color?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  state?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[]

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isFeatured?: boolean

  @IsOptional()
  @IsString()
  @IsIn(['active', 'paused', 'sold', 'moderation'])
  status?: string
}

class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['active', 'paused', 'sold', 'moderation'])
  status!: string
}

class UpdateFeaturedDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isFeatured?: boolean
}

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  // ── Public listing ─────────────────────────────────────────────────────
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('brand') brand?: string,
    @Query('model') model?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('yearMin') yearMin?: string,
    @Query('yearMax') yearMax?: string,
    @Query('fuel') fuel?: string,
    @Query('transmission') transmission?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.vehicles.findAll({
      q,
      type,
      brand,
      model,
      city,
      state,
      fuel,
      transmission,
      status,
      sortBy,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      yearMin: yearMin ? parseInt(yearMin) : undefined,
      yearMax: yearMax ? parseInt(yearMax) : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  // Admin list must be BEFORE :id to avoid shadowing
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminAll(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('brand') brand?: string,
    @Query('model') model?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('yearMin') yearMin?: string,
    @Query('yearMax') yearMax?: string,
    @Query('fuel') fuel?: string,
    @Query('transmission') transmission?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.vehicles.adminFindAll({
      q,
      type,
      brand,
      model,
      city,
      state,
      fuel,
      transmission,
      status,
      sortBy,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      yearMin: yearMin ? parseInt(yearMin) : undefined,
      yearMax: yearMax ? parseInt(yearMax) : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vehicles.mine(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.vehicles.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: CreateVehicleDto) {
    return this.vehicles.create(user.id, {
      title: body.title,
      description: body.description,
      type: body.type,
      brand: body.brand,
      model: body.model,
      year: body.year !== undefined ? Number(body.year) : undefined,
      mileage: body.mileage !== undefined ? Number(body.mileage) : undefined,
      fuel: body.fuel,
      transmission: body.transmission,
      color: body.color,
      city: body.city,
      state: body.state,
      price: Number(body.price),
      images: body.images,
      features: body.features,
      status: body.status,
      isFeatured: body.isFeatured,
    })
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    if (!body?.status) throw new BadRequestException('status é obrigatório')
    return this.vehicles.updateStatus(id, body.status)
  }

  @Put(':id/featured')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateFeatured(@Param('id') id: string, @Body() body?: UpdateFeaturedDto) {
    if (body && typeof body.isFeatured === 'boolean') {
      return this.vehicles.setFeatured(id, body.isFeatured)
    }
    return this.vehicles.toggleFeatured(id)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateVehicleDto,
  ) {
    const data: any = { ...body }
    if (data.year !== undefined) data.year = Number(data.year)
    if (data.mileage !== undefined) data.mileage = Number(data.mileage)
    if (data.price !== undefined) data.price = Number(data.price)
    return this.vehicles.update(id, user.id, data, !!user.isAdmin)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser() user: { id: string; isAdmin?: boolean }) {
    return this.vehicles.delete(id, user.id, !!user.isAdmin)
  }
}
