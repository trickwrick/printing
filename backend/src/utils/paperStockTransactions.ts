import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PaperStockTransaction,
  PaperStockTransactionDocument,
} from '../schemas/paper-stock-transaction.schema';

export interface LogPaperStockTransactionParams {
  paperStockId?: Types.ObjectId | string;
  stockName?: string;
  paperName?: string;
  paperType: string;
  transactionType: string;
  quantity: number;
  partyName?: string;
  jobNumber?: string;
  jobCardId?: Types.ObjectId | string;
  paperSource?: string;
  balanceAfter?: number;
  note?: string;
  createdAt?: Date | number;
}

@Injectable()
export class PaperStockTransactionsUtil {
  constructor(
    @InjectModel(PaperStockTransaction.name)
    private readonly transactionModel: Model<PaperStockTransactionDocument>,
  ) {}

  async logPaperStockTransaction({
    paperStockId,
    stockName,
    paperName,
    paperType,
    transactionType,
    quantity,
    partyName = '',
    jobNumber = '',
    jobCardId,
    paperSource = 'Company paper',
    balanceAfter = 0,
    note = '',
    createdAt,
  }: LogPaperStockTransactionParams): Promise<void> {
    const qty = Number(quantity) || 0;
    if (!qty) return;

    await this.transactionModel.create({
      paperStockId,
      stockName,
      paperName,
      paperType,
      transactionType,
      quantity: qty,
      partyName,
      jobNumber,
      jobCardId: jobCardId || undefined,
      paperSource,
      balanceAfter,
      note,
      createdAt: createdAt || Date.now(),
    });
  }
}
