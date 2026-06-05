import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaperStock, PaperStockDocument } from '../schemas/paper-stock.schema';
import {
  PaperStockTransaction,
  PaperStockTransactionDocument,
} from '../schemas/paper-stock-transaction.schema';
import { BackfillPaperStockTransactionsUtil } from '../utils/backfillPaperStockTransactions';
import { PaperStockTransactionsUtil } from '../utils/paperStockTransactions';

@Injectable()
export class PaperStockService {
  constructor(
    @InjectModel(PaperStock.name)
    private readonly paperStockModel: Model<PaperStockDocument>,
    @InjectModel(PaperStockTransaction.name)
    private readonly transactionModel: Model<PaperStockTransactionDocument>,
    private readonly paperStockTransactionsUtil: PaperStockTransactionsUtil,
    private readonly backfillUtil: BackfillPaperStockTransactionsUtil,
  ) {}

  async getTransactions() {
    await this.backfillUtil.backfillPaperStockTransactionsIfEmpty();
    return this.transactionModel.find().sort({ createdAt: -1 });
  }

  async findAll() {
    return this.paperStockModel.find().sort({ name: 1, gsm: 1 });
  }

  async create(body: Record<string, unknown>) {
    const {
      name,
      coverPartyName,
      coverName,
      innerPartyName,
      innerName,
      gsm,
      quantity,
      coverGSM,
      coverQuantity,
      coverPaperSize,
      innerGSM,
      innerQuantity,
      innerPaperSize,
      unit,
      description,
      lowStockThreshold,
      paperSource,
    } = body;

    const resolvedCoverName = String(coverName || '').trim();
    const resolvedInnerName = String(innerName || '').trim();
    const resolvedName =
      (name as string | undefined)?.trim() ||
      [resolvedCoverName, resolvedInnerName]
        .filter((value, index, arr) => value && arr.indexOf(value) === index)
        .join(' / ') ||
      'Unnamed Paper';

    const existing = await this.paperStockModel.findOne({
      name: resolvedName,
      paperSource: (paperSource as string) || 'Company paper',
    });
    if (existing) {
      throw new BadRequestException(
        'Paper with this name and Source already exists. Please update the existing entry.',
      );
    }

    const newItem = await this.paperStockModel.create({
      name: resolvedName,
      coverPartyName: String(coverPartyName || '').trim(),
      coverName: resolvedCoverName || resolvedName,
      innerPartyName: String(innerPartyName || '').trim(),
      innerName: resolvedInnerName || resolvedName,
      gsm,
      quantity,
      coverGSM,
      coverQuantity,
      coverPaperSize,
      innerGSM,
      innerQuantity,
      innerPaperSize,
      unit,
      description,
      lowStockThreshold,
      paperSource: (paperSource as string) || 'Company paper',
    });

    if (Number(coverQuantity) > 0) {
      await this.paperStockTransactionsUtil.logPaperStockTransaction({
        paperStockId: newItem._id,
        stockName: resolvedName,
        paperName: resolvedCoverName || resolvedName,
        paperType: 'cover',
        transactionType: 'add',
        quantity: Number(coverQuantity),
        paperSource: (paperSource as string) || 'Company paper',
        balanceAfter: Number(coverQuantity),
        note: 'Initial cover stock added',
      });
    }

    if (Number(innerQuantity) > 0) {
      await this.paperStockTransactionsUtil.logPaperStockTransaction({
        paperStockId: newItem._id,
        stockName: resolvedName,
        paperName: resolvedInnerName || resolvedName,
        paperType: 'inner',
        transactionType: 'add',
        quantity: Number(innerQuantity),
        paperSource: (paperSource as string) || 'Company paper',
        balanceAfter: Number(innerQuantity),
        note: 'Initial inner stock added',
      });
    }

    return newItem;
  }

  async update(id: string, body: Record<string, unknown>) {
    const {
      name,
      coverPartyName,
      coverName,
      innerPartyName,
      innerName,
      gsm,
      quantity,
      coverGSM,
      coverQuantity,
      coverPaperSize,
      innerGSM,
      innerQuantity,
      innerPaperSize,
      unit,
      description,
      lowStockThreshold,
      paperSource,
    } = body;

    const resolvedCoverName = String(coverName || '').trim();
    const resolvedInnerName = String(innerName || '').trim();
    const resolvedName =
      (name as string | undefined)?.trim() ||
      [resolvedCoverName, resolvedInnerName]
        .filter((value, index, arr) => value && arr.indexOf(value) === index)
        .join(' / ') ||
      'Unnamed Paper';

    const existing = await this.paperStockModel.findById(id);
    if (!existing) {
      throw new NotFoundException('Item not found');
    }

    const updated = await this.paperStockModel.findByIdAndUpdate(
      id,
      {
        name: resolvedName,
        coverPartyName: String(coverPartyName || '').trim(),
        coverName: resolvedCoverName || resolvedName,
        innerPartyName: String(innerPartyName || '').trim(),
        innerName: resolvedInnerName || resolvedName,
        gsm,
        quantity,
        coverGSM,
        coverQuantity,
        coverPaperSize,
        innerGSM,
        innerQuantity,
        innerPaperSize,
        unit,
        description,
        lowStockThreshold,
        paperSource,
        updatedAt: Date.now(),
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Item not found');
    }

    const coverAdded =
      Number(coverQuantity) - Number(existing.coverQuantity || 0);
    const innerAdded =
      Number(innerQuantity) - Number(existing.innerQuantity || 0);

    if (coverAdded > 0) {
      await this.paperStockTransactionsUtil.logPaperStockTransaction({
        paperStockId: updated._id,
        stockName: resolvedName,
        paperName: resolvedCoverName || resolvedName,
        paperType: 'cover',
        transactionType: 'add',
        quantity: coverAdded,
        paperSource:
          (paperSource as string) || existing.paperSource || 'Company paper',
        balanceAfter: Number(updated.coverQuantity || 0),
        note: 'Cover stock added',
      });
    }

    if (innerAdded > 0) {
      await this.paperStockTransactionsUtil.logPaperStockTransaction({
        paperStockId: updated._id,
        stockName: resolvedName,
        paperName: resolvedInnerName || resolvedName,
        paperType: 'inner',
        transactionType: 'add',
        quantity: innerAdded,
        paperSource:
          (paperSource as string) || existing.paperSource || 'Company paper',
        balanceAfter: Number(updated.innerQuantity || 0),
        note: 'Inner stock added',
      });
    }

    return updated;
  }

  async remove(id: string) {
    const deleted = await this.paperStockModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('Item not found');
    }
    return { message: 'Item deleted successfully' };
  }
}
