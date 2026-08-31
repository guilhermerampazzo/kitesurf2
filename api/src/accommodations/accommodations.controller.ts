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
import { AccommodationsService } from './accommodations.service'
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
  IsEmail,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

class CreateAccommodationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @IsString()
  @IsIn(['hotel', 'pousada', 'casa_temporada', 'hostel', 'resort', 'chale'])
  type!: string

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
  @Type(() => Number)
  @IsNumber()
  lat?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxGuests!: number

  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms!: number

  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms!: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerNight!: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cleaningFee?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minNights?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxNights?: number

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isInstantBook?: boolean

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

class UpdateAccommodationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  @IsIn(['hotel', 'pousada', 'casa_temporada', 'hostel', 'resort', 'chale'])
  type?: string

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
  @Type(() => Number)
  @IsNumber()
  lat?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxGuests?: number

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
  @IsArray()
  @IsString({ each: true })
  amenities?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerNight?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cleaningFee?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minNights?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxNights?: number

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isInstantBook?: boolean

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

class CreateBlockedDateDto {
  @IsString()
  @IsNotEmpty()
  date!: string // YYYY-MM-DD

  @IsOptional()
  @IsString()
  reason?: string
}

class BookDto {
  @IsString()
  @IsNotEmpty()
  checkIn!: string

  @IsString()
  @IsNotEmpty()
  checkOut!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests!: number

  @IsOptional()
  @IsString()
  guestName?: string

  @IsOptional()
  @IsString()
  guestPhone?: string

  @IsOptional()
  @IsString()
  @IsEmail()
  guestEmail?: string

  @IsOptional()
  @IsString()
  @IsIn(['pix', 'card', 'free', 'boleto'])
  paymentMethod?: string
}

class UpdateBookingStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'confirmed', 'cancelled', 'completed', 'refunded'])
  status!: string
}

class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['active', 'paused', 'moderation'])
  status!: string
}

@Controller('accommodations')
export class AccommodationsController {
  constructor(private readonly accommodations: AccommodationsService) {}

  // ── Public listing ────────────────────────────────────────────────────
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('guests') guests?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('amenities') amenities?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    let amenitiesArr: string[] | undefined
    if (amenities) {
      amenitiesArr = amenities.split(',').map((s) => s.trim()).filter(Boolean)
      if (amenitiesArr.length === 0) amenitiesArr = undefined
    }
    return this.accommodations.findAll({
      q,
      type,
      city,
      state,
      status,
      guests: guests ? parseInt(guests) : undefined,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      amenities: amenitiesArr,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminAll(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('guests') guests?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('amenities') amenities?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    let amenitiesArr: string[] | undefined
    if (amenities) {
      amenitiesArr = amenities.split(',').map((s) => s.trim()).filter(Boolean)
      if (amenitiesArr.length === 0) amenitiesArr = undefined
    }
    return this.accommodations.adminFindAll({
      q,
      type,
      city,
      state,
      status,
      guests: guests ? parseInt(guests) : undefined,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      amenities: amenitiesArr,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('bookings/mine')
  @UseGuards(JwtAuthGuard)
  getMyBookings(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accommodations.getMyBookings(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('host/bookings')
  @UseGuards(JwtAuthGuard)
  getHostBookings(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accommodations.getHostBookings(user.id, {
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
    return this.accommodations.mine(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get(':id/availability')
  availability(
    @Param('id') id: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
  ) {
    if (!checkIn || !checkOut) throw new BadRequestException('checkIn e checkOut são obrigatórios (YYYY-MM-DD)')
    return this.accommodations.checkAvailability(id, checkIn, checkOut)
  }

  @Get(':id/blocked-dates')
  getBlockedDates(@Param('id') id: string) {
    return this.accommodations.getBlockedDates(id)
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.accommodations.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: CreateAccommodationDto) {
    return this.accommodations.create(user.id, {
      title: body.title,
      description: body.description,
      type: body.type,
      city: body.city,
      state: body.state,
      address: body.address,
      lat: body.lat !== undefined ? Number(body.lat) : undefined,
      lng: body.lng !== undefined ? Number(body.lng) : undefined,
      maxGuests: Number(body.maxGuests),
      bedrooms: Number(body.bedrooms),
      bathrooms: Number(body.bathrooms),
      amenities: body.amenities,
      images: body.images,
      pricePerNight: Number(body.pricePerNight),
      cleaningFee: body.cleaningFee !== undefined ? Number(body.cleaningFee) : undefined,
      minNights: body.minNights !== undefined ? Number(body.minNights) : undefined,
      maxNights: body.maxNights !== undefined ? Number(body.maxNights) : undefined,
      isInstantBook: body.isInstantBook,
      status: body.status,
      isFeatured: body.isFeatured,
    })
  }

  @Post(':id/blocked-dates')
  @UseGuards(JwtAuthGuard)
  createBlockedDate(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: CreateBlockedDateDto,
  ) {
    return this.accommodations.createBlockedDate(id, user.id, body, !!user.isAdmin)
  }

  @Post(':id/book')
  @UseGuards(JwtAuthGuard)
  book(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: BookDto,
  ) {
    return this.accommodations.book(id, user.id, {
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      guests: Number(body.guests),
      guestName: body.guestName,
      guestPhone: body.guestPhone,
      guestEmail: body.guestEmail,
      paymentMethod: body.paymentMethod,
    })
  }

  @Put('bookings/:id/status')
  @UseGuards(JwtAuthGuard)
  updateBookingStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateBookingStatusDto,
  ) {
    if (!body?.status) throw new BadRequestException('status é obrigatório')
    return this.accommodations.updateBookingStatus(id, user.id, !!user.isAdmin, body.status)
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    if (!body?.status) throw new BadRequestException('status é obrigatório')
    return this.accommodations.updateStatus(id, body.status)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateAccommodationDto,
  ) {
    const data: any = { ...body }
    if (data.maxGuests !== undefined) data.maxGuests = Number(data.maxGuests)
    if (data.bedrooms !== undefined) data.bedrooms = Number(data.bedrooms)
    if (data.bathrooms !== undefined) data.bathrooms = Number(data.bathrooms)
    if (data.pricePerNight !== undefined) data.pricePerNight = Number(data.pricePerNight)
    if (data.cleaningFee !== undefined) data.cleaningFee = Number(data.cleaningFee)
    if (data.minNights !== undefined) data.minNights = Number(data.minNights)
    if (data.maxNights !== undefined) data.maxNights = Number(data.maxNights)
    if (data.lat !== undefined) data.lat = Number(data.lat)
    if (data.lng !== undefined) data.lng = Number(data.lng)
    return this.accommodations.update(id, user.id, data, !!user.isAdmin)
  }

  @Delete(':id/blocked-dates/:dateId')
  @UseGuards(JwtAuthGuard)
  deleteBlockedDate(
    @Param('id') id: string,
    @Param('dateId') dateId: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    return this.accommodations.deleteBlockedDate(id, dateId, user.id, !!user.isAdmin)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser() user: { id: string; isAdmin?: boolean }) {
    return this.accommodations.delete(id, user.id, !!user.isAdmin)
  }
}
