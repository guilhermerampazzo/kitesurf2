import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  IsObject,
  IsInt,
  Min,
  MaxLength,
  IsIn,
} from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  coverImage?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  @IsIn(['oficial', 'destaque', 'comum'])
  type?: string

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

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsString()
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
