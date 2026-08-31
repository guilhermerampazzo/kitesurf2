import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsIn,
} from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @IsString()
  @IsNotEmpty()
  categoryId!: string

  @IsOptional()
  @IsString()
  thumbnail?: string

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isFree?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  freeLessons?: number

  @IsOptional()
  @IsString()
  @IsIn(['iniciante', 'intermediario', 'avancado'])
  level?: string

  @IsOptional()
  @IsString()
  language?: string

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'active', 'archived', 'moderation'])
  status?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number
}
