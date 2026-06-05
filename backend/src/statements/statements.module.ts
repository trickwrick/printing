import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from '../schemas/invoice.schema';
import { Statement, StatementSchema } from '../schemas/statement.schema';
import { StatementsController } from './statements.controller';
import { StatementsService } from './statements.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Statement.name, schema: StatementSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
  ],
  controllers: [StatementsController],
  providers: [StatementsService],
})
export class StatementsModule {}
