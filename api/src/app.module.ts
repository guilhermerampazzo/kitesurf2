import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { PrismaModule } from './prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ListingsModule } from './listings/listings.module'
import { ChatModule } from './chat/chat.module'
import { ReviewsModule } from './reviews/reviews.module'
import { FavoritesModule } from './favorites/favorites.module'
import { PlansModule } from './plans/plans.module'
import { BannersModule } from './banners/banners.module'
import { ReportsModule } from './reports/reports.module'
import { AdminModule } from './admin/admin.module'
import { MailModule } from './mail/mail.module'
import { UploadsModule } from './uploads/uploads.module'
import { CheckoutModule } from './checkout/checkout.module'
import { KiteSchoolModule } from './kite-school/kite-school.module'
import { EventsModule } from './events/events.module'
import { TrainingModule } from './training/training.module'
import { ServicesOfferingModule } from './services-offering/services-offering.module'
import { CommissionModule } from './commission/commission.module'
import { AsaasModule } from './asaas/asaas.module'
import { PropertiesModule } from './properties/properties.module'
import { AccommodationsModule } from './accommodations/accommodations.module'
import { VehiclesModule } from './vehicles/vehicles.module'
import { BlogModule } from './blog/blog.module'
import { FashionModule } from './fashion/fashion.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    MailModule,
    UploadsModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    ChatModule,
    ReviewsModule,
    FavoritesModule,
    PlansModule,
    BannersModule,
    ReportsModule,
    AdminModule,
    CheckoutModule,
    CommissionModule,
    AsaasModule,
    KiteSchoolModule,
    EventsModule,
    TrainingModule,
    PropertiesModule,
    AccommodationsModule,
    VehiclesModule,
    BlogModule,
    FashionModule,
    ServicesOfferingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
