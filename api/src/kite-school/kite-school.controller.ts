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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { KiteSchoolService } from './kite-school.service'
import { UploadsService } from '../uploads/uploads.service'
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { CurrentUser } from '../common/decorators/user.decorator'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { CreateCourseDto } from './dto/create-course.dto'
import { UpdateCourseDto } from './dto/update-course.dto'
import { CreateLessonDto } from './dto/create-lesson.dto'
import { UpdateLessonDto } from './dto/update-lesson.dto'
import { UpdateProgressDto } from './dto/update-progress.dto'
import { IsOptional, IsString, IsIn } from 'class-validator'

class EnrollDto {
  @IsOptional()
  @IsString()
  @IsIn(['pix', 'card', 'boleto', 'free'])
  method?: string
}

class RefundDto {
  @IsOptional()
  @IsString()
  reason?: string
}

@Controller('kite-school')
export class KiteSchoolController {
  constructor(
    private readonly kiteSchool: KiteSchoolService,
    private readonly uploads: UploadsService,
  ) {}

  // ── Categories ──────────────────────────────────────────────────────────

  @Get('categories')
  findAllCategories() {
    return this.kiteSchool.findAllCategories()
  }

  @Get('categories/:id')
  findOneCategory(@Param('id') id: string) {
    return this.kiteSchool.findOneCategory(id)
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createCategory(@Body() body: CreateCategoryDto) {
    return this.kiteSchool.createCategory(body)
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateCategory(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    return this.kiteSchool.updateCategory(id, body)
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deleteCategory(@Param('id') id: string) {
    return this.kiteSchool.deleteCategory(id)
  }

  // ── Courses (public) ────────────────────────────────────────────────────

  @Get('courses')
  @UseGuards(OptionalJwtAuthGuard)
  findAllCourses(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('isFree') isFree?: string,
    @Query('instructor') instructor?: string,
    @Query('instructorId') instructorId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const isFreeBool =
      isFree === 'true' ? true : isFree === 'false' ? false : undefined
    return this.kiteSchool.findAllCourses({
      q,
      category,
      level,
      isFree: isFreeBool,
      instructorId: instructorId ?? instructor,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  // admin list must be BEFORE :id route to avoid shadowing
  @Get('admin/courses')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminListCourses(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('isFree') isFree?: string,
    @Query('instructor') instructor?: string,
    @Query('instructorId') instructorId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const isFreeBool =
      isFree === 'true' ? true : isFree === 'false' ? false : undefined
    return this.kiteSchool.adminListCourses({
      q,
      category,
      level,
      isFree: isFreeBool,
      instructorId: instructorId ?? instructor,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Put('admin/courses/:id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  moderateCourse(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    if (!body?.status) throw new BadRequestException('status é obrigatório')
    return this.kiteSchool.moderateCourse(id, body.status)
  }

  @Get('courses/:id')
  @UseGuards(OptionalJwtAuthGuard)
  findOneCourse(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string; isAdmin?: boolean },
  ) {
    return this.kiteSchool.findOneCourse(id, user?.id, !!user?.isAdmin)
  }

  @Post('courses')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('thumbnail', { storage: memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }))
  async createCourse(
    @CurrentUser() user: { id: string },
    @Body() body: CreateCourseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let thumbnail = body.thumbnail
    if (file) {
      const result = await this.uploads.saveImage(file, 'anuncios')
      thumbnail = result.url
    }
    return this.kiteSchool.createCourse(user.id, {
      ...body,
      thumbnail,
      // transform helpers: class-transformer already handles isFree boolean string
      price: body.price !== undefined ? Number(body.price) : undefined,
      freeLessons: body.freeLessons !== undefined ? Number(body.freeLessons) : undefined,
      commissionRate: body.commissionRate !== undefined ? Number(body.commissionRate) : undefined,
    })
  }

  @Put('courses/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('thumbnail', { storage: memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }))
  async updateCourse(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateCourseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let thumbnail = body.thumbnail
    if (file) {
      const result = await this.uploads.saveImage(file, 'anuncios')
      thumbnail = result.url
    }
    return this.kiteSchool.updateCourse(id, user.id, !!user.isAdmin, {
      ...body,
      ...(thumbnail ? { thumbnail } : {}),
      price: body.price !== undefined ? Number(body.price) : undefined,
      freeLessons: body.freeLessons !== undefined ? Number(body.freeLessons) : undefined,
      commissionRate: body.commissionRate !== undefined ? Number(body.commissionRate) : undefined,
    })
  }

  @Delete('courses/:id')
  @UseGuards(JwtAuthGuard)
  deleteCourse(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    return this.kiteSchool.deleteCourse(id, user.id, !!user.isAdmin)
  }

  // ── Lessons ─────────────────────────────────────────────────────────────

  @Get('courses/:courseId/lessons')
  @UseGuards(OptionalJwtAuthGuard)
  listLessons(
    @Param('courseId') courseId: string,
    @CurrentUser() user?: { id: string; isAdmin?: boolean },
  ) {
    return this.kiteSchool.listLessons(courseId, user?.id, !!user?.isAdmin)
  }

  @Post('courses/:courseId/lessons')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async createLesson(
    @Param('courseId') courseId: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: CreateLessonDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let videoUrl: string | undefined = body.videoUrl
    let videoType: string | undefined = body.videoType

    if (file) {
      if (body.videoType === 'youtube')
        throw new BadRequestException('Não envie arquivo quando videoType=youtube. Use youtubeUrl.')
      const saved = await this.uploads.saveVideo(file, 'courses')
      videoUrl = saved.url
      videoType = 'upload'
    } else if (body.youtubeUrl) {
      videoType = body.videoType ?? 'youtube'
    }

    return this.kiteSchool.createLesson(courseId, user.id, !!user.isAdmin, {
      title: body.title,
      description: body.description,
      videoType: videoType ?? body.videoType,
      youtubeUrl: body.youtubeUrl,
      videoUrl,
      duration: body.duration !== undefined ? Number(body.duration) : undefined,
      order: body.order !== undefined ? Number(body.order) : undefined,
      isPreview: body.isPreview,
      isFree: body.isFree,
    })
  }

  @Put('lessons/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async updateLesson(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
    @Body() body: UpdateLessonDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let videoUrl: string | undefined = body.videoUrl
    let videoType: string | undefined = body.videoType

    if (file) {
      if (body.videoType === 'youtube')
        throw new BadRequestException('Não envie arquivo quando videoType=youtube.')
      const saved = await this.uploads.saveVideo(file, 'courses')
      videoUrl = saved.url
      videoType = 'upload'
    }

    return this.kiteSchool.updateLesson(id, user.id, !!user.isAdmin, {
      title: body.title,
      description: body.description,
      videoType: videoType ?? body.videoType,
      youtubeUrl: body.youtubeUrl,
      videoUrl,
      duration: body.duration !== undefined ? Number(body.duration) : undefined,
      order: body.order !== undefined ? Number(body.order) : undefined,
      isPreview: body.isPreview,
      isFree: body.isFree,
    })
  }

  @Delete('lessons/:id')
  @UseGuards(JwtAuthGuard)
  deleteLesson(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; isAdmin?: boolean },
  ) {
    return this.kiteSchool.deleteLesson(id, user.id, !!user.isAdmin)
  }

  // ── Enrollments ─────────────────────────────────────────────────────────

  @Post('courses/:id/enroll')
  @UseGuards(JwtAuthGuard)
  enroll(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body?: EnrollDto,
  ) {
    return this.kiteSchool.enroll(user.id, id, body?.method)
  }

  @Get('enrollments/mine')
  @UseGuards(JwtAuthGuard)
  getMyEnrollments(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.kiteSchool.getMyEnrollments(user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('courses/:id/progress')
  @UseGuards(JwtAuthGuard)
  getProgress(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.kiteSchool.getProgress(user.id, id)
  }

  @Post('lessons/:id/progress')
  @UseGuards(JwtAuthGuard)
  updateProgress(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: UpdateProgressDto,
  ) {
    return this.kiteSchool.updateLessonProgress(user.id, id, {
      watchedSeconds: body.watchedSeconds !== undefined ? Number(body.watchedSeconds) : undefined,
      isCompleted: body.isCompleted,
    })
  }

  @Post('enrollments/:id/refund')
  @UseGuards(JwtAuthGuard)
  refundByEnrollment(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.kiteSchool.refund(user.id, id)
  }

  @Post('courses/:id/refund')
  @UseGuards(JwtAuthGuard)
  refundByCourse(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.kiteSchool.refund(user.id, id)
  }
}
