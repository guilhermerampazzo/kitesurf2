import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  MaxLength,
  IsIn,
  IsDateString,
  IsArray,
} from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateTicketTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxPerUser?: number

  @IsOptional()
  @IsDateString()
  salesStart?: string

  @IsOptional()
  @IsDateString()
  salesEnd?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiresInfo?: string[]

  @IsOptional()
  @IsString()
  @IsIn(['active', 'sold_out', 'paused'])
  status?: string
}
