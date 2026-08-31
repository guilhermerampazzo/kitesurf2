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
import { FashionService } from './fashion.service'
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { CurrentUser } from '../common/decorators/user.decorator'
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsArray,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

class CreateFashionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @IsString()
  @IsNotEmpty()
  category!: string

  @IsOptional()
  @IsString()
  brand?: string

  @IsOptional()
  @IsString()
  size?: string

  @IsOptional()
  @IsString()
  color?: string

  @IsOptional()
  @IsString()
  @IsIn(['new', 'used'])
  condition?: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsOptional()
  @IsString()
  @IsIn(['active', 'paused', 'sold', 'moderation'])
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

class UpdateFashionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  brand?: string

  @IsOptional()
  @IsString()
  size?: string

  @IsOptional()
  @IsString()
  color?: string

  @IsOptional()
  @IsString()
  @IsIn(['new', 'used'])
  condition?: string

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
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isFeatured!: boolean
}

@Controller('fashion')
export class FashionController {
  constructor(private readonly fashion: FashionService) {}

  // ── Public listing ─────────────────────────────────────────────────────
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('size') size?: string,
    @Query('color') color?: string,
    @Query('condition') condition?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.fashion.findAll({
      q,
      category,
      brand,
      size,
      color,
      condition,
      status,
      sortBy,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  // Admin list must be BEFORE :id
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminAll(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('size') size?: string,
    @Query('color') color?: string,
    @Query('condition') condition?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.fashion.adminFindAll({
      q,
      category,
      brand,
      size,
      color,
      condition,
      status,
      sortBy,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
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
    return this.fashion.mine(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.fashion.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: CreateFashionDto) {
    return this.fashion.create(user.id, {
      title: body.title,
      description: body.description,
      category: body.category,
      brand: body.brand,
      size: body.size,
      color: body.color,
      condition: body.condition,
      price: Number(body.price),
      images: body.images,
      status: body.status,
      isFeatured: body.isFeatured,
    })
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    if (!body?.status) throw new BadRequestException('status é obrigatório')
    return this.fashion.updateStatus(id, body.status)
  }

  @Put(':id/featured')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateFeatured(@Param('id') id: string, @Body() body: UpdateFeaturedDto) {
    if (body?.isFeatured === undefined) throw new BadRequestException('isFeatured é obrigatório')
    return this.fashion.updateFeatured(id, body.isFeatured)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateFashionDto,
  ) {
    return this.fashion.update(id, user.id, body as any, !!user.isAdmin)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser() user: { id: string; isAdmin?: boolean }) {
    return this.fashion.delete(id, user.id, !!user.isAdmin)
  }
}
