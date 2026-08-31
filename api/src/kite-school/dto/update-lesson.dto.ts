import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  @IsIn(['upload', 'youtube'])
  videoType?: string

  @IsOptional()
  @IsString()
  youtubeUrl?: string

  @IsOptional()
  @IsString()
  videoUrl?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isPreview?: boolean

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isFree?: boolean
}
