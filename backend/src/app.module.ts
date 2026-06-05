import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChallanModule } from './challan/challan.module';
import { DatabaseModule } from './database/database.module';
import { InvoiceModule } from './invoice/invoice.module';
import { JobcardModule } from './jobcard/jobcard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaperStockModule } from './paper-stock/paper-stock.module';
import { PaymentTypeModule } from './payment-type/payment-type.module';
import { SettingsModule } from './settings/settings.module';
import { StatementsModule } from './statements/statements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot(),
    JobcardModule,
    InvoiceModule,
    ChallanModule,
    PaymentTypeModule,
    AuthModule,
    SettingsModule,
    NotificationsModule,
    PaperStockModule,
    StatementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
