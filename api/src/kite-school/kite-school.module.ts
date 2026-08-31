import { Module } from '@nestjs/common'
import { KiteSchoolService } from './kite-school.service'
import { KiteSchoolController } from './kite-school.controller'
import { CommissionModule } from '../commission/commission.module'
import { AsaasModule } from '../asaas/asaas.module'
import { UploadsModule } from '../uploads/uploads.module'

@Module({
  imports: [CommissionModule, AsaasModule, UploadsModule],
  providers: [KiteSchoolService],
  controllers: [KiteSchoolController],
  exports: [KiteSchoolService],
})
export class KiteSchoolModule {}
