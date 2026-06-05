import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Challan, ChallanDocument } from '../schemas/challan.schema';

@Injectable()
export class ChallanService {
  constructor(
    @InjectModel(Challan.name)
    private readonly challanModel: Model<ChallanDocument>,
  ) {}

  async saveOrUpdate(body: Record<string, unknown>) {
    const challanNo = body.challanNo as string | undefined;

    if (challanNo) {
      return this.challanModel.findOneAndUpdate(
        { challanNo },
        { ...body },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
    }

    return this.challanModel.create(body);
  }

  async findAll() {
    return this.challanModel.find().sort({ createdAt: -1 });
  }

  async update(id: string, body: Record<string, unknown>) {
    const updated = await this.challanModel.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!updated) {
      throw new NotFoundException('Challan not found');
    }
    return updated;
  }

  async remove(id: string) {
    const result = await this.challanModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Challan not found');
    }
    return { message: 'Challan deleted successfully' };
  }
}
