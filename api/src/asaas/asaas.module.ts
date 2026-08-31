import { Module } from '@nestjs/common'
import { AsaasService } from './asaas.service'
import { AsaasController } from './asaas.controller'
import { CommissionModule } from '../commission/commission.module'

@Module({
  imports: [CommissionModule],
  providers: [AsaasService],
  controllers: [AsaasController],
  exports: [AsaasService],
})
export class AsaasModule {}
