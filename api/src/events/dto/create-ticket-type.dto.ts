import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
  MaxLength,
  IsIn,
  IsDateString,
  IsArray,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateTicketTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number

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
