import { Types } from 'mongoose';
import { PaperStockTransaction } from '@/server/models';

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

export async function logPaperStockTransaction({
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

  await PaperStockTransaction.create({
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
