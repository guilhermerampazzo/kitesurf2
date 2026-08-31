import { IsOptional, IsString, IsNotEmpty } from 'class-validator'

export class CheckinDto {
  @IsOptional()
  @IsString()
  qrCode?: string

  @IsOptional()
  @IsString()
  backupCode?: string

  // must provide one
}

export class FeaturedPayDto {
  @IsOptional()
  @IsString()
  method?: string
}
