import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobCard, JobCardSchema } from '../schemas/job-card.schema';
import { PaperStock, PaperStockSchema } from '../schemas/paper-stock.schema';
import {
  PaperStockTransaction,
  PaperStockTransactionSchema,
} from '../schemas/paper-stock-transaction.schema';
import { BackfillPaperStockTransactionsUtil } from '../utils/backfillPaperStockTransactions';
import { PaperStockTransactionsUtil } from '../utils/paperStockTransactions';
import { PaperStockController } from './paper-stock.controller';
import { PaperStockService } from './paper-stock.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaperStock.name, schema: PaperStockSchema },
      { name: PaperStockTransaction.name, schema: PaperStockTransactionSchema },
      { name: JobCard.name, schema: JobCardSchema },
    ]),
  ],
  controllers: [PaperStockController],
  providers: [
    PaperStockService,
    PaperStockTransactionsUtil,
    BackfillPaperStockTransactionsUtil,
  ],
})
export class PaperStockModule {}
