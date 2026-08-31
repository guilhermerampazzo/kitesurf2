import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsNumber,
  ValidateNested,
  IsIn,
  IsObject,
  ArrayMinSize,
  IsInt,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

export class AttendeeInfoDto {
  @IsString()
  @IsNotEmpty()
  nome!: string

  @IsOptional()
  @IsString()
  cpf?: string

  @IsOptional()
  @IsString()
  email?: string
}

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  ticketTypeId!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendeeInfoDto)
  attendeeInfo?: AttendeeInfoDto[]
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[]

  @IsOptional()
  @IsObject()
  buyerInfo?: Record<string, any>

  @IsOptional()
  @IsString()
  @IsIn(['pix', 'card', 'free'])
  paymentMethod?: string
}
