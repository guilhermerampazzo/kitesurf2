import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common'
import { CommissionService } from './commission.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator'

class UpsertCommissionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedFee?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get()
  findAll() {
    return this.commissionService.findAll()
  }

  @Get(':module')
  findOne(@Param('module') module: string) {
    return this.commissionService.findOne(module)
  }

  @Put(':module')
  @UseGuards(JwtAuthGuard, AdminGuard)
  upsert(
    @Param('module') module: string,
    @Body() body: UpsertCommissionDto,
  ) {
    return this.commissionService.upsert(
      module,
      body.percentage,
      body.fixedFee,
      body.isActive,
    )
  }
}
