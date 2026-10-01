import { IsString, IsNotEmpty, IsIn } from 'class-validator'

export class RideStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['arriving', 'ongoing', 'completed', 'cancelled'])
  status!: string
}
