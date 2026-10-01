import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { BuberService } from './buber.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { CurrentUser } from '../common/decorators/user.decorator'
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn,
  IsInt,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'
import { RegisterDriverDto } from './dto/register-driver.dto'
import { EstimateDto } from './dto/estimate.dto'
import { CreateRideDto } from './dto/create-ride.dto'
import { CreateRouteDto } from './dto/create-route.dto'
import { BookSeatDto } from './dto/book-seat.dto'
import { RideStatusDto } from './dto/ride-status.dto'
import { FareConfigDto } from './dto/fare-config.dto'

class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vehicleModel?: string

  @IsOptional()
  @IsString()
  @MaxLength(10)
  vehiclePlate?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  vehicleColor?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  vehicleSeats?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  currentLat?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  currentLng?: number
}

class SetOnlineDto {
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isOnline!: boolean

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number
}

class AdminDriverStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'approved', 'rejected', 'suspended'])
  status!: string
}

@Controller('buber')
export class BuberController {
  constructor(private readonly buber: BuberService) {}

  // ── Tarifa / estimativa (público) ──────────────────────────────────────
  @Get('fare')
  getFare() {
    return this.buber.getFare()
  }

  @Post('estimate')
  estimate(@Body() body: EstimateDto) {
    return this.buber.estimate(
      Number(body.originLat),
      Number(body.originLng),
      Number(body.destLat),
      Number(body.destLng),
    )
  }

  // ── Motorista ──────────────────────────────────────────────────────────
  @Post('drivers/register')
  @UseGuards(JwtAuthGuard)
  registerDriver(@CurrentUser() user: { id: string }, @Body() body: RegisterDriverDto) {
    return this.buber.registerDriver(user.id, {
      cnh: body.cnh,
      vehicleModel: body.vehicleModel,
      vehiclePlate: body.vehiclePlate,
      vehicleColor: body.vehicleColor,
      vehicleSeats: body.vehicleSeats !== undefined ? Number(body.vehicleSeats) : undefined,
    })
  }

  @Patch('drivers/me')
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: { id: string }, @Body() body: UpdateMeDto) {
    return this.buber.updateMe(user.id, {
      ...(body.vehicleModel !== undefined ? { vehicleModel: body.vehicleModel } : {}),
      ...(body.vehiclePlate !== undefined ? { vehiclePlate: body.vehiclePlate } : {}),
      ...(body.vehicleColor !== undefined ? { vehicleColor: body.vehicleColor } : {}),
      ...(body.vehicleSeats !== undefined ? { vehicleSeats: Number(body.vehicleSeats) } : {}),
      ...(body.currentLat !== undefined ? { currentLat: Number(body.currentLat) } : {}),
      ...(body.currentLng !== undefined ? { currentLng: Number(body.currentLng) } : {}),
    })
  }

  @Post('drivers/me/online')
  @UseGuards(JwtAuthGuard)
  setOnline(@CurrentUser() user: { id: string }, @Body() body: SetOnlineDto) {
    return this.buber.setOnline(
      user.id,
      body.isOnline,
      body.lat !== undefined ? Number(body.lat) : undefined,
      body.lng !== undefined ? Number(body.lng) : undefined,
    )
  }

  // ── Corridas ───────────────────────────────────────────────────────────
  @Get('rides/available')
  @UseGuards(JwtAuthGuard)
  availableRides() {
    return this.buber.availableRides()
  }

  @Get('rides/mine')
  @UseGuards(JwtAuthGuard)
  myRides(@CurrentUser() user: { id: string }) {
    return this.buber.myRides(user.id)
  }

  @Post('rides')
  @UseGuards(JwtAuthGuard)
  createRide(@CurrentUser() user: { id: string }, @Body() body: CreateRideDto) {
    return this.buber.createRide(user.id, {
      originLabel: body.originLabel,
      originLat: Number(body.originLat),
      originLng: Number(body.originLng),
      destLabel: body.destLabel,
      destLat: Number(body.destLat),
      destLng: Number(body.destLng),
    })
  }

  @Post('rides/:id/accept')
  @UseGuards(JwtAuthGuard)
  acceptRide(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.buber.acceptRide(id, user.id)
  }

  @Post('rides/:id/status')
  @UseGuards(JwtAuthGuard)
  updateRideStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: RideStatusDto,
  ) {
    return this.buber.updateRideStatus(id, user.id, body.status)
  }

  // ── Trajetos (carona) ──────────────────────────────────────────────────
  @Get('routes')
  listRoutes(@Query('status') status?: string) {
    return this.buber.listRoutes(status)
  }

  @Post('routes')
  @UseGuards(JwtAuthGuard)
  createRoute(@CurrentUser() user: { id: string }, @Body() body: CreateRouteDto) {
    return this.buber.createRoute(user.id, {
      title: body.title,
      originLabel: body.originLabel,
      destLabel: body.destLabel,
      stops: body.stops,
      departsAt: body.departsAt,
      seatsTotal: Number(body.seatsTotal),
      pricePerSeat: Number(body.pricePerSeat),
    })
  }

  @Post('routes/:id/book')
  @UseGuards(JwtAuthGuard)
  bookRoute(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: BookSeatDto,
  ) {
    return this.buber.bookRoute(id, user.id, Number(body.seats))
  }

  // ── Admin ──────────────────────────────────────────────────────────────
  @Get('admin/drivers')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminDrivers() {
    return this.buber.listDrivers()
  }

  @Post('admin/drivers/:id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminDriverStatus(@Param('id') id: string, @Body() body: AdminDriverStatusDto) {
    return this.buber.setDriverStatus(id, body.status)
  }

  @Get('admin/fare')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminGetFare() {
    return this.buber.getFare()
  }

  @Put('admin/fare')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminUpsertFare(@Body() body: FareConfigDto) {
    return this.buber.upsertFare({
      minFare: Number(body.minFare),
      pricePerKm: Number(body.pricePerKm),
      pricePerMin: Number(body.pricePerMin),
      ...(body.cancelFee !== undefined ? { cancelFee: Number(body.cancelFee) } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    })
  }
}
