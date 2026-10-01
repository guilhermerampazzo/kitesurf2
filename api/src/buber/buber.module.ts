import { Module } from '@nestjs/common'
import { BuberService } from './buber.service'
import { BuberController } from './buber.controller'
import { AsaasModule } from '../asaas/asaas.module'

@Module({
  imports: [AsaasModule],
  providers: [BuberService],
  controllers: [BuberController],
  exports: [BuberService],
})
export class BuberModule {}
