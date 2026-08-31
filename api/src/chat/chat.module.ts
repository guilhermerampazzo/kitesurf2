import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ChatService } from './chat.service'
import { ChatController } from './chat.controller'
import { ChatGateway } from './chat.gateway'
import { ContactFilterService } from './contact-filter.service'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get('JWT_EXPIRES_IN') ?? '7d' },
      }),
    }),
  ],
  providers: [ChatService, ChatGateway, ContactFilterService],
  controllers: [ChatController],
  exports: [ContactFilterService],
})
export class ChatModule {}
