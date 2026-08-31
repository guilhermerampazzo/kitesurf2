import { Module } from '@nestjs/common'
import { ServicesOfferingService } from './services-offering.service'
import { ServicesOfferingController } from './services-offering.controller'
import { CommissionModule } from '../commission/commission.module'
import { AsaasModule } from '../asaas/asaas.module'

@Module({
  imports: [CommissionModule, AsaasModule],
  providers: [ServicesOfferingService],
  controllers: [ServicesOfferingController],
  exports: [ServicesOfferingService],
})
export class ServicesOfferingModule {}
