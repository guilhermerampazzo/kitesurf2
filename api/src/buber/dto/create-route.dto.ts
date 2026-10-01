import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsInt,
  IsNumber,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originLabel!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  destLabel!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stops?: string[]

  @IsDateString()
  departsAt!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  seatsTotal!: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerSeat!: number
}
