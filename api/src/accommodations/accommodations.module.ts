import { Module } from '@nestjs/common'
import { AccommodationsService } from './accommodations.service'
import { AccommodationsController } from './accommodations.controller'
import { CommissionModule } from '../commission/commission.module'
import { AsaasModule } from '../asaas/asaas.module'

@Module({
  imports: [CommissionModule, AsaasModule],
  providers: [AccommodationsService],
  controllers: [AccommodationsController],
  exports: [AccommodationsService],
})
export class AccommodationsModule {}
