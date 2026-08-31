import { Module } from '@nestjs/common'
import { TrainingService } from './training.service'
import { TrainingController } from './training.controller'
import { CommissionModule } from '../commission/commission.module'
import { AsaasModule } from '../asaas/asaas.module'

@Module({
  imports: [CommissionModule, AsaasModule],
  providers: [TrainingService],
  controllers: [TrainingController],
  exports: [TrainingService],
})
export class TrainingModule {}
