import { IsOptional, IsBoolean, IsInt, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class UpdateProgressDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  watchedSeconds?: number

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isCompleted?: boolean
}
