import { IsString, IsOptional, IsNumber, Min, Max, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateRideDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originLabel?: string

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  originLat!: number

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  originLng!: number

  @IsOptional()
  @IsString()
  @MaxLength(255)
  destLabel?: string

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  destLat!: number

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  destLng!: number
}
