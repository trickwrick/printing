import { JobCard, Notification, PaperStock } from '@/server/models';
import {
  computePlateUseCount,
  syncStockFromJobChange,
} from '@/server/utils/jobcard-stock.helpers';

export async function saveOrUpdate(body: Record<string, unknown>) {
  const { partyName } = body;
  const jobNumber = body.jobNumber as string | undefined;

  if (partyName && !body.companyName) {
    body.companyName = partyName;
  }

  let jobCard = null;
  let isUpdate = false;
  const _id = body._id as string | undefined;
  let previousJob = null;

  if (_id) {
    previousJob = await JobCard.findById(_id);
  }

  if (body.plateSize) {
    body.plateSize = String(body.plateSize).trim();
    body.plateUseCount = await computePlateUseCount(
      JobCard,
      body.plateSize as string,
      _id,
    );
  }

  if (_id) {
    jobCard = await JobCard.findByIdAndUpdate(
      _id,
      { ...body, updatedAt: new Date() },
      { new: true },
    );
    if (jobCard) isUpdate = true;
  }

  if (!isUpdate && jobNumber) {
    const existingJob = await JobCard.findOne({ jobNumber });
    if (existingJob) {
      isUpdate = true;
      previousJob = previousJob || existingJob;
      jobCard = await JobCard.findOneAndUpdate(
        { jobNumber },
        { ...body, updatedAt: new Date() },
        { new: true },
      );
    } else {
      jobCard = await JobCard.create(body);
    }
  } else if (!isUpdate) {
    const lastJob = await JobCard.findOne()
      .sort({ createdAt: -1 })
      .select('jobNumber');
    let nextNum = 1;
    if (lastJob?.jobNumber) {
      const lastNum = parseInt(
        String(lastJob.jobNumber).replace(/[^0-9]/g, ''),
        10,
      );
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const generatedJobNumber = `JOBHR-${String(nextNum).padStart(4, '0')}`;
    body.jobNumber = generatedJobNumber;
    jobCard = await JobCard.create(body);
  }

  if (!jobCard) {
    throw new Error('Failed to save job card');
  }

  try {
    await syncStockFromJobChange(PaperStock, previousJob, {
      ...body,
      _id: jobCard._id || body._id,
      jobNumber: jobCard.jobNumber || body.jobNumber,
    });
  } catch (stockErr) {
    const message =
      stockErr instanceof Error ? stockErr.message : String(stockErr);
    console.error('Stock deduction failed:', message);
  }

  try {
    const notifMessage = isUpdate
      ? `Job Card updated: #${jobCard.jobNumber} for ${jobCard.partyName}`
      : `New Job Card created: #${jobCard.jobNumber} for ${jobCard.partyName}`;

    await Notification.create({
      type: isUpdate ? 'JOB_UPDATED' : 'JOB_CREATED',
      message: notifMessage,
    });
  } catch (notifErr) {
    const message =
      notifErr instanceof Error ? notifErr.message : String(notifErr);
    console.error('Failed to create notification:', message);
  }

  return jobCard;
}

export async function getPlateUsedCount(plateSize?: string, editingId?: string) {
  if (!plateSize) return { plateUseCount: '' };
  const plateUseCount = await computePlateUseCount(
    JobCard,
    String(plateSize).trim(),
    editingId,
  );
  return { plateUseCount };
}

export async function findAll() {
  return JobCard.find().sort({ createdAt: -1 });
}

export async function findOne(id: string) {
  const jobCard = await JobCard.findById(id);
  if (!jobCard) {
    throw new Error('Job Card not found');
  }
  return jobCard;
}

export async function remove(id: string) {
  const result = await JobCard.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Job Card not found');
  }
  return { message: 'Job Card deleted successfully' };
}

export async function updatePrice(id: string, totalAmount: number) {
  const jobCard = await JobCard.findByIdAndUpdate(
    id,
    { totalAmount, updatedAt: new Date() },
    { new: true },
  );

  if (!jobCard) {
    throw new Error('Job Card not found');
  }

  try {
    await Notification.create({
      type: 'PRICE_UPDATED',
      message: `Price updated for Job #${jobCard.jobNumber}: ₹${totalAmount}`,
    });
  } catch (nErr) {
    const message = nErr instanceof Error ? nErr.message : String(nErr);
    console.error('Notif Error:', message);
  }

  return jobCard;
}
