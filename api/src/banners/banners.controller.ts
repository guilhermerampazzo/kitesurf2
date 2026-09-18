import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, HttpCode } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { BannersService } from './banners.service'
import { UploadsService } from '../uploads/uploads.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'

@Controller('banners')
export class BannersController {
  constructor(private banners: BannersService, private uploads: UploadsService) {}

  @Get()
  getForSlot(@Query('slot') slot: string) {
    return this.banners.getForSlot(slot)
  }

  // Compatibility with web client (`/banners/slot/:slot`)
  @Get('slot/:slot')
  getForSlotByPath(@Param('slot') slot: string) {
    return this.banners.getForSlot(slot)
  }

  @Post(':id/impression')
  @HttpCode(204)
  impression(@Param('id') id: string) {
    return this.banners.trackImpression(id)
  }

  @Post(':id/click')
  @HttpCode(200)
  click(@Param('id') id: string) {
    return this.banners.trackClick(id)
  }

  // Admin routes
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminAll() { return this.banners.findAllAdmin() }

  @Get('admin/slots')
  @UseGuards(JwtAuthGuard, AdminGuard)
  slots() { return this.banners.findAllSlots() }

  @Post('admin/slots')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createSlot(@Body() body: { name: string; position: string; isPremium?: boolean; maxBanners?: number }) {
    return this.banners.createSlot(body)
  }

  @Post('admin/banners')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async createBanner(
    @Body() body: { slotId: string; advertiser: string; linkUrl: string; weight?: string; startsAt: string; endsAt: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl = ''
    if (file) {
      const result = await this.uploads.saveImage(file, 'banners')
      imageUrl = result.url
    }
    return this.banners.createBanner({
      slotId: body.slotId,
      advertiser: body.advertiser,
      imageUrl,
      linkUrl: body.linkUrl,
      weight: body.weight ? parseInt(body.weight) : 1,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
    })
  }

  @Put('admin/banners/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateBanner(@Param('id') id: string, @Body() body: { status?: string; weight?: number }) {
    return this.banners.updateBanner(id, body)
  }
}
