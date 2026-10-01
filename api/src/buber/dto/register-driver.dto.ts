import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'

export class RegisterDriverDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cnh!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  vehicleModel!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  vehiclePlate!: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  vehicleColor?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  vehicleSeats?: number
}
