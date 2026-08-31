import { Module } from '@nestjs/common'
import { EventsService } from './events.service'
import { EventsController } from './events.controller'
import { CommissionModule } from '../commission/commission.module'
import { AsaasModule } from '../asaas/asaas.module'

@Module({
  imports: [CommissionModule, AsaasModule],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
