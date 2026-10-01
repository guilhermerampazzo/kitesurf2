import { IsNumber, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class EstimateDto {
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
