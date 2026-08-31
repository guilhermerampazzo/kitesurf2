import { Module } from '@nestjs/common'
import { FashionService } from './fashion.service'
import { FashionController } from './fashion.controller'

@Module({
  providers: [FashionService],
  controllers: [FashionController],
  exports: [FashionService],
})
export class FashionModule {}
