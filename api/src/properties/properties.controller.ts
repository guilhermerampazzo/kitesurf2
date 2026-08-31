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
import { PropertiesService } from './properties.service'
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
  MaxLength,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @IsString()
  @IsIn(['casa', 'apartamento', 'terreno', 'comercial', 'kitnet', 'cobertura'])
  type!: string

  @IsString()
  @IsIn(['venda', 'aluguel'])
  purpose!: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  suites?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  area?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  garageSpots?: number

  @IsString()
  @IsNotEmpty()
  city!: string

  @IsString()
  @IsNotEmpty()
  state!: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  neighborhood?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

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
  @IsIn(['active', 'paused', 'sold', 'rented', 'moderation'])
  status?: string
}

class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  @IsIn(['casa', 'apartamento', 'terreno', 'comercial', 'kitnet', 'cobertura'])
  type?: string

  @IsOptional()
  @IsString()
  @IsIn(['venda', 'aluguel'])
  purpose?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  suites?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  area?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  garageSpots?: number

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  state?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  neighborhood?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

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
  @IsIn(['active', 'paused', 'sold', 'rented', 'moderation'])
  status?: string
}

class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['active', 'paused', 'sold', 'rented', 'moderation'])
  status!: string
}

@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  // ── Public listing ─────────────────────────────────────────────────────
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('purpose') purpose?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('status') status?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.properties.findAll({
      q,
      type,
      purpose,
      city,
      state,
      status,
      sortBy,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
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
    @Query('purpose') purpose?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('status') status?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.properties.adminFindAll({
      q,
      type,
      purpose,
      city,
      state,
      status,
      sortBy,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
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
    return this.properties.mine(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.properties.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: CreatePropertyDto) {
    return this.properties.create(user.id, {
      title: body.title,
      description: body.description,
      type: body.type,
      purpose: body.purpose,
      price: Number(body.price),
      bedrooms: body.bedrooms !== undefined ? Number(body.bedrooms) : undefined,
      bathrooms: body.bathrooms !== undefined ? Number(body.bathrooms) : undefined,
      suites: body.suites !== undefined ? Number(body.suites) : undefined,
      area: body.area !== undefined ? Number(body.area) : undefined,
      garageSpots: body.garageSpots !== undefined ? Number(body.garageSpots) : undefined,
      city: body.city,
      state: body.state,
      address: body.address,
      neighborhood: body.neighborhood,
      lat: body.lat !== undefined ? Number(body.lat) : undefined,
      lng: body.lng !== undefined ? Number(body.lng) : undefined,
      features: body.features,
      images: body.images,
      status: body.status,
      isFeatured: body.isFeatured,
    })
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    if (!body?.status) throw new BadRequestException('status é obrigatório')
    return this.properties.updateStatus(id, body.status)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdatePropertyDto,
  ) {
    return this.properties.update(id, user.id, body, !!user.isAdmin)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser() user: { id: string; isAdmin?: boolean }) {
    return this.properties.delete(id, user.id, !!user.isAdmin)
  }
}
