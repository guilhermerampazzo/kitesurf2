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
import { BlogService } from './blog.service'
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { CurrentUser } from '../common/decorators/user.decorator'
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsIn,
  MaxLength,
} from 'class-validator'

class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  slug?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string

  @IsString()
  @IsNotEmpty()
  content!: string

  @IsOptional()
  @IsString()
  coverImage?: string

  @IsOptional()
  @IsString()
  @IsIn(['moda', 'kite_style', 'tendencia', 'entrevista'])
  category?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published', 'archived'])
  status?: string
}

class UpdateBlogDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  slug?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsString()
  coverImage?: string

  @IsOptional()
  @IsString()
  @IsIn(['moda', 'kite_style', 'tendencia', 'entrevista'])
  category?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published', 'archived'])
  status?: string
}

class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['draft', 'published', 'archived'])
  status!: string
}

@Controller('blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  // ── Public listing ──────────────────────────────────────────────────────
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('status') status?: string,
    @Query('authorId') authorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @CurrentUser() user?: { id: string; isAdmin?: boolean },
  ) {
    const isAdmin = !!user?.isAdmin
    // Non-admin cannot see non-published even if they pass status; service enforces
    // If admin passes status, respects; otherwise returns all? For public with status=all should still only see published
    return this.blog.findAll({
      q,
      category,
      tag,
      status,
      authorId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy,
      requesterIsAdmin: isAdmin,
    })
  }

  // Admin list must be BEFORE :slug to avoid shadowing
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminAll(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('status') status?: string,
    @Query('authorId') authorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.blog.adminFindAll({
      q,
      category,
      tag,
      status,
      authorId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy,
    })
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.blog.mine(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
    })
  }

  @Get('id/:id')
  findById(@Param('id') id: string) {
    return this.blog.findById(id)
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blog.findBySlug(slug)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: CreateBlogDto) {
    return this.blog.create(user.id, {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      coverImage: body.coverImage,
      category: body.category,
      tags: body.tags,
      status: body.status,
    })
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    if (!body?.status) throw new BadRequestException('status é obrigatório')
    return this.blog.updateStatus(id, body.status)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateBlogDto,
  ) {
    return this.blog.update(id, user.id, body as any, !!user.isAdmin)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser() user: { id: string; isAdmin?: boolean }) {
    return this.blog.delete(id, user.id, !!user.isAdmin)
  }
}
