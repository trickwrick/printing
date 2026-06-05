import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
  ) {}

  async saveOrUpdate(body: Record<string, unknown>) {
    const invoiceNumber = body.invoiceNumber as string | undefined;

    if (invoiceNumber) {
      return this.invoiceModel.findOneAndUpdate(
        { invoiceNumber },
        { ...body },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
    }

    return this.invoiceModel.create(body);
  }

  async findAll() {
    return this.invoiceModel.find().sort({ createdAt: -1 });
  }

  async update(id: string, body: Record<string, unknown>) {
    const updated = await this.invoiceModel.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!updated) {
      throw new NotFoundException('Invoice not found');
    }
    return updated;
  }

  async remove(id: string) {
    const result = await this.invoiceModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Invoice not found');
    }
    return { message: 'Invoice deleted successfully' };
  }
}
