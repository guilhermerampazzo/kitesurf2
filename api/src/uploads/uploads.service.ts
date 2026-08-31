import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { join, extname } from 'path'
import { mkdirSync, existsSync, writeFileSync } from 'fs'
import * as sharp from 'sharp'
import { v4 as uuid } from 'uuid'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_MIME = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]
const VIDEO_MAX_MB = 50

@Injectable()
export class UploadsService {
  private uploadDir: string
  private maxMb: number

  constructor(private config: ConfigService) {
    this.uploadDir = config.get('UPLOAD_DIR') ?? '/app/uploads'
    this.maxMb = parseInt(config.get('MAX_UPLOAD_MB') ?? '15')
  }

  async saveImage(file: Express.Multer.File, subdir: 'anuncios' | 'banners' | 'perfis' = 'anuncios'): Promise<{ url: string; thumb: string }> {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de arquivo não permitido: ${file.mimetype}`)
    }
    if (file.size > this.maxMb * 1024 * 1024) {
      throw new BadRequestException(`Arquivo muito grande. Máximo ${this.maxMb}MB.`)
    }

    const dir = join(this.uploadDir, subdir)
    const thumbDir = join(dir, 'thumbs')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    if (!existsSync(thumbDir)) mkdirSync(thumbDir, { recursive: true })

    const id = uuid()
    const filename = `${id}.webp`
    const thumbName = `${id}_thumb.webp`
    const filePath = join(dir, filename)
    const thumbPath = join(thumbDir, thumbName)

    // Save full image (max 1200px wide)
    await sharp(file.buffer)
      .resize(1200, undefined, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filePath)

    // Generate thumbnail (400x300)
    await sharp(file.buffer)
      .resize(400, 300, { fit: 'cover' })
      .webp({ quality: 75 })
      .toFile(thumbPath)

    const base = `/uploads/${subdir}`
    return {
      url:   `${base}/${filename}`,
      thumb: `${base}/thumbs/${thumbName}`,
    }
  }

  async saveVideo(
    file: Express.Multer.File,
    subdir = 'courses',
  ): Promise<{ url: string; path: string }> {
    if (!ALLOWED_VIDEO_MIME.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de vídeo não permitido: ${file.mimetype}`)
    }
    if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
      throw new BadRequestException(
        `Vídeo muito grande. Máximo ${VIDEO_MAX_MB}MB. Use YouTube para vídeos maiores.`,
      )
    }

    const dir = join(this.uploadDir, subdir)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    const ext = extname(file.originalname) || '.mp4'
    const id = uuid()
    const filename = `${id}${ext}`
    const filePath = join(dir, filename)
    writeFileSync(filePath, file.buffer)

    return {
      url: `/uploads/${subdir}/${filename}`,
      path: filePath,
    }
  }
}
