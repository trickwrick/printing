import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobCard, JobCardDocument } from '../schemas/job-card.schema';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { PaperStock, PaperStockDocument } from '../schemas/paper-stock.schema';
import { PaperStockTransactionsUtil } from '../utils/paperStockTransactions';
import {
  computePlateUseCount,
  syncStockFromJobChange,
} from './jobcard-stock.helpers';

@Injectable()
export class JobcardService {
  constructor(
    @InjectModel(JobCard.name)
    private readonly jobCardModel: Model<JobCardDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(PaperStock.name)
    private readonly paperStockModel: Model<PaperStockDocument>,
    private readonly paperStockTransactionsUtil: PaperStockTransactionsUtil,
  ) {}

  async saveOrUpdate(body: Record<string, unknown>) {
    const { partyName } = body;
    const jobNumber = body.jobNumber as string | undefined;

    if (partyName && !body.companyName) {
      body.companyName = partyName;
    }

    let jobCard: JobCardDocument | null = null;
    let isUpdate = false;
    const _id = body._id as string | undefined;
    let previousJob: JobCardDocument | null = null;

    if (_id) {
      previousJob = await this.jobCardModel.findById(_id);
    }

    if (body.plateSize) {
      body.plateSize = String(body.plateSize).trim();
      body.plateUseCount = await computePlateUseCount(
        this.jobCardModel,
        body.plateSize as string,
        _id,
      );
    }

    if (_id) {
      jobCard = await this.jobCardModel.findByIdAndUpdate(
        _id,
        { ...body, updatedAt: new Date() },
        { new: true },
      );
      if (jobCard) isUpdate = true;
    }

    if (!isUpdate && jobNumber) {
      const existingJob = await this.jobCardModel.findOne({ jobNumber });
      if (existingJob) {
        isUpdate = true;
        previousJob = previousJob || existingJob;
        jobCard = await this.jobCardModel.findOneAndUpdate(
          { jobNumber },
          { ...body, updatedAt: new Date() },
          { new: true },
        );
      } else {
        jobCard = await this.jobCardModel.create(body);
      }
    } else if (!isUpdate) {
      const lastJob = await this.jobCardModel
        .findOne()
        .sort({ createdAt: -1 })
        .select('jobNumber');
      let nextNum = 1;
      if (lastJob?.jobNumber) {
        const lastNum = parseInt(
          lastJob.jobNumber.replace(/[^0-9]/g, ''),
          10,
        );
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      const generatedJobNumber = `JOBHR-${String(nextNum).padStart(4, '0')}`;
      body.jobNumber = generatedJobNumber;
      jobCard = await this.jobCardModel.create(body);
    }

    if (!jobCard) {
      throw new BadRequestException('Failed to save job card');
    }

    try {
      await syncStockFromJobChange(
        this.paperStockModel,
        this.paperStockTransactionsUtil,
        previousJob,
        {
          ...body,
          _id: jobCard._id || body._id,
          jobNumber: jobCard.jobNumber || body.jobNumber,
        },
      );
    } catch (stockErr) {
      const message =
        stockErr instanceof Error ? stockErr.message : String(stockErr);
      console.error('⚠️ Stock deduction failed:', message);
    }

    try {
      const notifMessage = isUpdate
        ? `Job Card updated: #${jobCard.jobNumber} for ${jobCard.partyName}`
        : `New Job Card created: #${jobCard.jobNumber} for ${jobCard.partyName}`;

      await this.notificationModel.create({
        type: isUpdate ? 'JOB_UPDATED' : 'JOB_CREATED',
        message: notifMessage,
      });
    } catch (notifErr) {
      const message =
        notifErr instanceof Error ? notifErr.message : String(notifErr);
      console.error('Failed to create notification:', message);
    }

    console.log(`☁️ Job Card Saved to MongoDB: ${jobCard.jobNumber}`);
    return jobCard;
  }

  async getPlateUsedCount(plateSize?: string, editingId?: string) {
    if (!plateSize) return { plateUseCount: '' };
    const plateUseCount = await computePlateUseCount(
      this.jobCardModel,
      String(plateSize).trim(),
      editingId,
    );
    return { plateUseCount };
  }

  async findAll() {
    return this.jobCardModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const jobCard = await this.jobCardModel.findById(id);
    if (!jobCard) {
      throw new NotFoundException('Job Card not found');
    }
    return jobCard;
  }

  async remove(id: string) {
    const result = await this.jobCardModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Job Card not found');
    }
    return { message: 'Job Card deleted successfully' };
  }

  async updatePrice(id: string, totalAmount: number) {
    const jobCard = await this.jobCardModel.findByIdAndUpdate(
      id,
      { totalAmount, updatedAt: new Date() },
      { new: true },
    );

    if (!jobCard) {
      throw new NotFoundException('Job Card not found');
    }

    try {
      await this.notificationModel.create({
        type: 'PRICE_UPDATED',
        message: `Price updated for Job #${jobCard.jobNumber}: ₹${totalAmount}`,
      });
    } catch (nErr) {
      const message = nErr instanceof Error ? nErr.message : String(nErr);
      console.error('Notif Error:', message);
    }

    return jobCard;
  }
}
