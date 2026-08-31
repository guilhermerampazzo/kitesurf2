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
import { TrainingService } from './training.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
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

// ── DTOs ────────────────────────────────────────────────────────────────────

class CreateTrainerDto {
  @IsString()
  @IsIn(['academia', 'personal'])
  type!: string

  @IsOptional()
  @IsString()
  businessName?: string

  @IsOptional()
  @IsString()
  bio?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[]

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
}

class UpdateTrainerDto {
  @IsOptional()
  @IsString()
  @IsIn(['academia', 'personal'])
  type?: string

  @IsOptional()
  @IsString()
  businessName?: string

  @IsOptional()
  @IsString()
  bio?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[]

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
}

class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  @IsNotEmpty()
  category!: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration!: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxParticipants?: number
}

class UpdateServiceDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxParticipants?: number

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isActive?: boolean
}

class CreateAvailabilityDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number

  @IsString()
  @IsNotEmpty()
  startTime!: string

  @IsString()
  @IsNotEmpty()
  endTime!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  slotDuration?: number
}

class BookSlotDto {
  @IsString()
  @IsNotEmpty()
  date!: string // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  startTime!: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsString()
  @IsIn(['pix', 'card', 'free', 'boleto'])
  paymentMethod?: string
}

class UpdateBookingStatusDto {
  @IsString()
  @IsIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
  status!: string
}

class VerifyTrainerDto {
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isVerified!: boolean
}

@Controller('training')
export class TrainingController {
  constructor(private readonly training: TrainingService) {}

  // ── Trainers ────────────────────────────────────────────────────────────────

  @Get('trainers')
  listTrainers(
    @Query('city') city?: string,
    @Query('type') type?: string,
    @Query('specialty') specialty?: string,
    @Query('isVerified') isVerified?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const isVerifiedBool = isVerified === 'true' ? true : isVerified === 'false' ? false : undefined
    return this.training.listTrainers({
      city,
      type,
      specialty,
      isVerified: isVerifiedBool,
      q,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    })
  }

  @Get('trainers/me')
  @UseGuards(JwtAuthGuard)
  getMyTrainer(@CurrentUser() user: { id: string }) {
    return this.training.getTrainerByUserId(user.id)
  }

  @Get('trainers/:id')
  getTrainer(@Param('id') id: string) {
    return this.training.getTrainer(id)
  }

  @Post('trainers')
  @UseGuards(JwtAuthGuard)
  createTrainer(@CurrentUser() user: { id: string }, @Body() body: CreateTrainerDto) {
    return this.training.createTrainer(user.id, body)
  }

  @Put('trainers/me')
  @UseGuards(JwtAuthGuard)
  updateOwnTrainer(@CurrentUser() user: { id: string }, @Body() body: UpdateTrainerDto) {
    return this.training.updateOwnTrainer(user.id, body)
  }

  @Put('trainers/:id/verify')
  @UseGuards(JwtAuthGuard, AdminGuard)
  verifyTrainer(@Param('id') id: string, @Body() body: VerifyTrainerDto) {
    return this.training.verifyTrainer(id, body.isVerified)
  }

  // ── Services ────────────────────────────────────────────────────────────────
  // IMPORTANT: Specific routes (slots, availability, book) must be before :id

  @Get('services')
  listServices(
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('trainerId') trainerId?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.training.listServices({
      category,
      city,
      trainerId,
      q,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    })
  }

  @Get('services/:id/slots')
  getSlots(@Param('id') id: string, @Query('date') date: string) {
    if (!date) throw new BadRequestException('Query param date é obrigatório (YYYY-MM-DD).')
    return this.training.getSlots(id, date)
  }

  @Get('services/:id/availability')
  listAvailabilities(@Param('id') id: string) {
    return this.training.listAvailabilities(id)
  }

  @Post('services/:id/availability')
  @UseGuards(JwtAuthGuard)
  createAvailability(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: CreateAvailabilityDto,
  ) {
    return this.training.createAvailability(user.id, !!user.isAdmin, id, body)
  }

  @Delete('services/:serviceId/availability/:availabilityId')
  @UseGuards(JwtAuthGuard)
  deleteAvailability(
    @Param('serviceId') serviceId: string,
    @Param('availabilityId') availabilityId: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    return this.training.deleteAvailability(user.id, !!user.isAdmin, serviceId, availabilityId)
  }

  // Fallback: DELETE /training/services/:id/availability?availabilityId=xxx
  // Keeps backward compatibility if client sends query param
  @Delete('services/:id/availability')
  @UseGuards(JwtAuthGuard)
  deleteAvailabilityByQuery(
    @Param('id') id: string,
    @Query('availabilityId') availabilityId: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    if (!availabilityId) throw new BadRequestException('availabilityId é obrigatório (query param).')
    return this.training.deleteAvailability(user.id, !!user.isAdmin, id, availabilityId)
  }

  @Post('services/:id/book')
  @UseGuards(JwtAuthGuard)
  bookSlot(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: BookSlotDto,
  ) {
    return this.training.bookSlot(user.id, id, body)
  }

  @Get('services/:id')
  getService(@Param('id') id: string) {
    return this.training.getService(id)
  }

  @Post('services')
  @UseGuards(JwtAuthGuard)
  createService(@CurrentUser() user: { id: string }, @Body() body: CreateServiceDto) {
    return this.training.createService(user.id, body)
  }

  @Put('services/:id')
  @UseGuards(JwtAuthGuard)
  updateService(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateServiceDto,
  ) {
    return this.training.updateService(user.id, !!user.isAdmin, id, body)
  }

  @Delete('services/:id')
  @UseGuards(JwtAuthGuard)
  deleteService(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    return this.training.deleteService(user.id, !!user.isAdmin, id)
  }

  // ── Bookings ────────────────────────────────────────────────────────────────

  @Get('bookings/mine')
  @UseGuards(JwtAuthGuard)
  myBookings(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.training.listMyBookings(user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    })
  }

  @Get('bookings/received')
  @UseGuards(JwtAuthGuard)
  receivedBookings(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.training.listReceivedBookings(user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    })
  }

  @Put('bookings/:id/status')
  @UseGuards(JwtAuthGuard)
  updateBookingStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateBookingStatusDto,
  ) {
    return this.training.updateBookingStatus(id, user, body.status)
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  @Get('admin/bookings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminBookings(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('serviceId') serviceId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.training.adminListBookings({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      serviceId,
      userId,
    })
  }

  @Get('admin/trainers')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminTrainers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isVerified') isVerified?: string,
    @Query('q') q?: string,
    @Query('type') type?: string,
  ) {
    const isVerifiedBool = isVerified === 'true' ? true : isVerified === 'false' ? false : undefined
    return this.training.adminListTrainers({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      isVerified: isVerifiedBool,
      q,
      type,
    })
  }
}
