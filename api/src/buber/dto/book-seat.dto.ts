import { IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class BookSeatDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  seats!: number
}
