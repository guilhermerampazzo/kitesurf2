import { Module } from '@nestjs/common'
import { BlogService } from './blog.service'
import { BlogController } from './blog.controller'
import { ChatModule } from '../chat/chat.module'

@Module({
  imports: [ChatModule],
  providers: [BlogService],
  controllers: [BlogController],
  exports: [BlogService],
})
export class BlogModule {}
