import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';
import { Statement, StatementDocument } from '../schemas/statement.schema';

@Injectable()
export class StatementsService {
  constructor(
    @InjectModel(Statement.name)
    private readonly statementModel: Model<StatementDocument>,
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
  ) {}

  async findAll() {
    return this.statementModel.find().sort({ date: -1 });
  }

  async create(body: Record<string, unknown>) {
    const invoiceNumber = body.invoiceNumber as string | undefined;
    const partyName = body.partyName as string | undefined;
    const date = body.date as Date | undefined;
    const amount = body.amount as number | string | undefined;
    const paymentMethod = body.paymentMethod as string | undefined;
    const notes = body.notes as string | undefined;

    if (!invoiceNumber || !amount || !paymentMethod) {
      throw new BadRequestException(
        'Invoice Number, Amount, and Method are required',
      );
    }

    const newStatement = await this.statementModel.create({
      invoiceNumber,
      partyName,
      date: date || new Date(),
      amount: Number(amount),
      paymentMethod,
      notes,
    });

    const invoice = await this.invoiceModel.findOne({ invoiceNumber });
    if (invoice) {
      invoice.paidAmount = (invoice.paidAmount || 0) + Number(amount);
      await invoice.save();
      console.log(
        `✅ Invoice ${invoiceNumber} updated. New Paid Amount: ${invoice.paidAmount}`,
      );
    }

    return newStatement;
  }

  async remove(id: string) {
    const statement = await this.statementModel.findById(id);
    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    const invoice = await this.invoiceModel.findOne({
      invoiceNumber: statement.invoiceNumber,
    });
    if (invoice) {
      invoice.paidAmount = Math.max(
        0,
        (invoice.paidAmount || 0) - statement.amount,
      );
      await invoice.save();
    }

    await this.statementModel.findByIdAndDelete(id);
    return { message: 'Statement deleted and invoice updated successfully' };
  }
}
