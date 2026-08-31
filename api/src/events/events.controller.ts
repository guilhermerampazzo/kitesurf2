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
import { EventsService } from './events.service'
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { CurrentUser } from '../common/decorators/user.decorator'
import { CreateEventDto } from './dto/create-event.dto'
import { UpdateEventDto } from './dto/update-event.dto'
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto'
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto'
import { CreateOrderDto } from './dto/create-order.dto'
import { CheckinDto, FeaturedPayDto } from './dto/checkin.dto'

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  // ── Static / specific GETs (must be before :id) ──────────────────

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.events.mine(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('orders/mine')
  @UseGuards(JwtAuthGuard)
  myOrders(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.events.listMyOrders(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminAll(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.events.adminAll({
      q,
      status,
      type,
      category,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminPending(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.events.pending({
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
    return this.events.findOrderById(id, user.id, !!user.isAdmin)
  }

  @Post('tickets/checkin')
  @UseGuards(JwtAuthGuard)
  checkin(
    @Body() body: CheckinDto,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    if (!body.qrCode && !body.backupCode) throw new BadRequestException('Informe qrCode ou backupCode.')
    return this.events.checkin({ qrCode: body.qrCode, backupCode: body.backupCode }, user.id, !!user.isAdmin)
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('status') status?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('startDateFrom') startDateFrom?: string,
    @Query('startDateTo') startDateTo?: string,
    @Query('organizerId') organizerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    const isFeaturedBool =
      isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined
    return this.events.findAll({
      q,
      category,
      type,
      city,
      state,
      status,
      isFeatured: isFeaturedBool,
      startDateFrom,
      startDateTo,
      organizerId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy,
    })
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: CreateEventDto,
  ) {
    return this.events.create(user.id, !!user.isAdmin, body as any)
  }

  // ── Routes with :id prefix (2-3 segments) – before generic :id ──

  @Post(':id/ticket-types')
  @UseGuards(JwtAuthGuard)
  createTicketType(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: CreateTicketTypeDto,
  ) {
    return this.events.createTicketType(id, user.id, !!user.isAdmin, body as any)
  }

  @Get(':id/ticket-types')
  listTicketTypes(@Param('id') id: string) {
    return this.events.listTicketTypes(id)
  }

  @Put(':eventId/ticket-types/:id')
  @UseGuards(JwtAuthGuard)
  updateTicketType(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateTicketTypeDto,
  ) {
    return this.events.updateTicketType(eventId, id, user.id, !!user.isAdmin, body as any)
  }

  @Delete(':eventId/ticket-types/:id')
  @UseGuards(JwtAuthGuard)
  deleteTicketType(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    return this.events.deleteTicketType(eventId, id, user.id, !!user.isAdmin)
  }

  @Post(':id/orders')
  @UseGuards(JwtAuthGuard)
  createOrder(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: CreateOrderDto,
  ) {
    return this.events.createOrder(id, user.id, body as any)
  }

  @Get(':id/orders')
  @UseGuards(JwtAuthGuard)
  listEventOrders(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.events.listEventOrders(id, user.id, !!user.isAdmin, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get(':id/tickets')
  @UseGuards(JwtAuthGuard)
  listTickets(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.events.listTickets(id, user.id, !!user.isAdmin, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 100,
      status,
    })
  }

  @Post(':id/featured/pay')
  @UseGuards(JwtAuthGuard)
  featuredPay(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: FeaturedPayDto,
  ) {
    return this.events.featuredPay(id, user.id, !!user.isAdmin, body?.method)
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    if (!body?.status) throw new BadRequestException('status é obrigatório.')
    return this.events.updateStatus(id, body.status, !!user.isAdmin)
  }

  // ── Generic :id (must be last) ─────────────────────────────────

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.events.findOne(id)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateEventDto,
  ) {
    return this.events.update(id, user.id, !!user.isAdmin, body as any)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    return this.events.delete(id, user.id, !!user.isAdmin)
  }
}
