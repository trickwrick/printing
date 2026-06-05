import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentType, PaymentTypeDocument } from '../schemas/payment-type.schema';

@Injectable()
export class PaymentTypeService {
  constructor(
    @InjectModel(PaymentType.name)
    private readonly paymentTypeModel: Model<PaymentTypeDocument>,
  ) {}

  async create(name: string) {
    if (!name) {
      throw new BadRequestException('Name is required');
    }
    return this.paymentTypeModel.create({ name });
  }

  async findAll() {
    return this.paymentTypeModel.find().sort({ name: 1 });
  }

  async update(id: string, name: string) {
    const payment = await this.paymentTypeModel.findByIdAndUpdate(
      id,
      { name, updatedAt: Date.now() },
      { new: true },
    );
    if (!payment) {
      throw new NotFoundException('Payment Type not found');
    }
    return payment;
  }

  async remove(id: string) {
    const result = await this.paymentTypeModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Payment Type not found');
    }
    return { message: 'Payment Type deleted successfully' };
  }
}
