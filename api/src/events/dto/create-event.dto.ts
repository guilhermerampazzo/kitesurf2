import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsDateString,
  IsUrl,
  IsObject,
  IsInt,
  Min,
  MaxLength,
  IsIn,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @IsOptional()
  @IsString()
  coverImage?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsString()
  @IsNotEmpty()
  category!: string // kitesurf|musica|gastronomia|esporte|workshop etc

  @IsOptional()
  @IsString()
  @IsIn(['oficial', 'destaque', 'comum'])
  type?: string

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
  @IsString()
  venue?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number

  @IsDateString()
  startDate!: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsString()
  // validate HH:mm format loosely
  startTime?: string

  @IsOptional()
  @IsString()
  organizerName?: string

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAttendees?: number
}
