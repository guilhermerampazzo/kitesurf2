import { IsNumber, IsOptional, IsBoolean, Min } from 'class-validator'
import { Type, Transform } from 'class-transformer'

export class FareConfigDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minFare!: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerKm!: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerMin!: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cancelFee?: number

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isActive?: boolean
}
