import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobCard, JobCardSchema } from '../schemas/job-card.schema';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { PaperStock, PaperStockSchema } from '../schemas/paper-stock.schema';
import {
  PaperStockTransaction,
  PaperStockTransactionSchema,
} from '../schemas/paper-stock-transaction.schema';
import { PaperStockTransactionsUtil } from '../utils/paperStockTransactions';
import { JobcardController } from './jobcard.controller';
import { JobcardService } from './jobcard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobCard.name, schema: JobCardSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: PaperStock.name, schema: PaperStockSchema },
      { name: PaperStockTransaction.name, schema: PaperStockTransactionSchema },
    ]),
  ],
  controllers: [JobcardController],
  providers: [JobcardService, PaperStockTransactionsUtil],
})
export class JobcardModule {}
