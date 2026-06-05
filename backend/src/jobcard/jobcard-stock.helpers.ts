import { Model } from 'mongoose';
import { JobCard, JobCardDocument } from '../schemas/job-card.schema';
import { PaperStock, PaperStockDocument } from '../schemas/paper-stock.schema';
import { PaperStockTransactionsUtil } from '../utils/paperStockTransactions';

const escapeRegex = (value: string) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getCoverUsage = (job: Partial<JobCard> | null | undefined) => {
  if (
    !job ||
    job.paperSource !== 'Company paper' ||
    !job.paper ||
    !job.paperGSM
  ) {
    return null;
  }
  const qty =
    Number(job.coverPaperCount) > 0
      ? Number(job.coverPaperCount)
      : Number(job.jobQty) || 0;
  if (qty <= 0) return null;
  return { paper: job.paper, paperGSM: String(job.paperGSM), qty };
};

export const getInnerUsage = (job: Partial<JobCard> | null | undefined) => {
  if (
    !job ||
    job.paperSource !== 'Company paper' ||
    !job.innerPaper ||
    !job.innerPaperGSM
  ) {
    return null;
  }
  const qty = Number(job.innerPaperCount) || 0;
  if (qty <= 0) return null;
  return {
    paper: job.innerPaper,
    paperGSM: String(job.innerPaperGSM),
    qty,
  };
};

export const computePlateUseCount = async (
  jobCardModel: Model<JobCardDocument>,
  plateSize: string,
  editingId?: string,
): Promise<number | undefined> => {
  if (!plateSize) return undefined;

  const normalizedSize = String(plateSize).trim();
  const existingCount = await jobCardModel.countDocuments({
    plateSize: normalizedSize,
  });

  if (!editingId) return existingCount + 1;

  const editingCard = await jobCardModel
    .findById(editingId)
    .select('plateSize');
  if (String(editingCard?.plateSize || '').trim() === normalizedSize) {
    return existingCount;
  }

  return existingCount + 1;
};

export const findCoverStock = async (
  paperStockModel: Model<PaperStockDocument>,
  paper: string,
) => {
  if (!paper) return null;
  return paperStockModel.findOne({
    $or: [
      { coverName: { $regex: new RegExp(`^${escapeRegex(paper)}$`, 'i') } },
      { name: { $regex: new RegExp(`^${escapeRegex(paper)}$`, 'i') } },
    ],
    paperSource: 'Company paper',
  });
};

export const findInnerStock = async (
  paperStockModel: Model<PaperStockDocument>,
  paper: string,
) => {
  if (!paper) return null;
  return paperStockModel.findOne({
    $or: [
      { innerName: { $regex: new RegExp(`^${escapeRegex(paper)}$`, 'i') } },
      { name: { $regex: new RegExp(`^${escapeRegex(paper)}$`, 'i') } },
    ],
    paperSource: 'Company paper',
  });
};

export const applyCoverDelta = async (
  paperStockModel: Model<PaperStockDocument>,
  paperStockTransactionsUtil: PaperStockTransactionsUtil,
  paper: string,
  paperGSM: string,
  delta: number,
  meta: {
    partyName?: string;
    jobNumber?: string;
    jobCardId?: unknown;
    note?: string;
  } = {},
) => {
  if (!paper || !paperGSM || !delta) return;
  const stockItem = await findCoverStock(paperStockModel, paper);
  if (!stockItem) return;

  const gsm = Number(paperGSM);
  let balanceAfter = 0;

  if (stockItem.coverGSM === gsm) {
    stockItem.coverQuantity = Math.max(
      0,
      (stockItem.coverQuantity || 0) - delta,
    );
    stockItem.quantity = Math.max(0, (stockItem.quantity || 0) - delta);
    balanceAfter = stockItem.coverQuantity;
    await stockItem.save();
    console.log(
      `📦 Cover stock adjusted: ${paper} (${paperGSM} GSM) delta ${delta}, remaining ${stockItem.coverQuantity}`,
    );
  } else if (stockItem.gsm === gsm) {
    stockItem.quantity = Math.max(0, (stockItem.quantity || 0) - delta);
    balanceAfter = stockItem.quantity;
    await stockItem.save();
    console.log(
      `📦 Cover stock adjusted (legacy): ${paper} (${paperGSM} GSM) delta ${delta}, remaining ${stockItem.quantity}`,
    );
  } else {
    return;
  }

  await paperStockTransactionsUtil.logPaperStockTransaction({
    paperStockId: stockItem._id,
    stockName: stockItem.name,
    paperName: paper,
    paperType: 'cover',
    transactionType: delta > 0 ? 'deduct' : 'add',
    quantity: Math.abs(delta),
    partyName: meta.partyName || '',
    jobNumber: meta.jobNumber || '',
    jobCardId: meta.jobCardId as string | undefined,
    paperSource: stockItem.paperSource || 'Company paper',
    balanceAfter,
    note:
      meta.note ||
      (delta > 0 ? 'Deducted for job card' : 'Restored from job card update'),
  });
};

export const applyInnerDelta = async (
  paperStockModel: Model<PaperStockDocument>,
  paperStockTransactionsUtil: PaperStockTransactionsUtil,
  paper: string,
  paperGSM: string,
  delta: number,
  meta: {
    partyName?: string;
    jobNumber?: string;
    jobCardId?: unknown;
    note?: string;
  } = {},
) => {
  if (!paper || !paperGSM || !delta) return;
  const stockItem = await findInnerStock(paperStockModel, paper);
  if (!stockItem) return;

  const gsm = Number(paperGSM);
  let balanceAfter = 0;

  if (stockItem.innerGSM === gsm) {
    stockItem.innerQuantity = Math.max(
      0,
      (stockItem.innerQuantity || 0) - delta,
    );
    balanceAfter = stockItem.innerQuantity;
    await stockItem.save();
    console.log(
      `📦 Inner stock adjusted: ${paper} (${paperGSM} GSM) delta ${delta}, remaining ${stockItem.innerQuantity}`,
    );
  } else if (stockItem.gsm === gsm) {
    stockItem.quantity = Math.max(0, (stockItem.quantity || 0) - delta);
    balanceAfter = stockItem.quantity;
    await stockItem.save();
    console.log(
      `📦 Inner stock adjusted (legacy): ${paper} (${paperGSM} GSM) delta ${delta}, remaining ${stockItem.quantity}`,
    );
  } else {
    return;
  }

  await paperStockTransactionsUtil.logPaperStockTransaction({
    paperStockId: stockItem._id,
    stockName: stockItem.name,
    paperName: paper,
    paperType: 'inner',
    transactionType: delta > 0 ? 'deduct' : 'add',
    quantity: Math.abs(delta),
    partyName: meta.partyName || '',
    jobNumber: meta.jobNumber || '',
    jobCardId: meta.jobCardId as string | undefined,
    paperSource: stockItem.paperSource || 'Company paper',
    balanceAfter,
    note:
      meta.note ||
      (delta > 0 ? 'Deducted for job card' : 'Restored from job card update'),
  });
};

export const syncStockFromJobChange = async (
  paperStockModel: Model<PaperStockDocument>,
  paperStockTransactionsUtil: PaperStockTransactionsUtil,
  previousJob: JobCardDocument | null,
  newBody: Record<string, unknown>,
) => {
  const paperSource = (newBody.paperSource as string) || 'Company paper';
  if (paperSource !== 'Company paper') return;

  const oldCover = getCoverUsage(previousJob);
  const newCover = getCoverUsage({ ...newBody, paperSource } as Partial<JobCard>);
  const oldInner = getInnerUsage(previousJob);
  const newInner = getInnerUsage({ ...newBody, paperSource } as Partial<JobCard>);

  if (oldCover) {
    await applyCoverDelta(
      paperStockModel,
      paperStockTransactionsUtil,
      oldCover.paper,
      oldCover.paperGSM,
      -oldCover.qty,
      {
        partyName:
          previousJob?.partyName || previousJob?.companyName || '',
        jobNumber: previousJob?.jobNumber || '',
        jobCardId: previousJob?._id,
        note: 'Restored from job card update',
      },
    );
  }
  if (oldInner) {
    await applyInnerDelta(
      paperStockModel,
      paperStockTransactionsUtil,
      oldInner.paper,
      oldInner.paperGSM,
      -oldInner.qty,
      {
        partyName:
          previousJob?.partyName || previousJob?.companyName || '',
        jobNumber: previousJob?.jobNumber || '',
        jobCardId: previousJob?._id,
        note: 'Restored from job card update',
      },
    );
  }
  if (newCover) {
    await applyCoverDelta(
      paperStockModel,
      paperStockTransactionsUtil,
      newCover.paper,
      newCover.paperGSM,
      newCover.qty,
      {
        partyName:
          (newBody.partyName as string) ||
          (newBody.companyName as string) ||
          '',
        jobNumber: (newBody.jobNumber as string) || '',
        jobCardId: newBody._id,
        note: 'Deducted for job card',
      },
    );
  }
  if (newInner) {
    await applyInnerDelta(
      paperStockModel,
      paperStockTransactionsUtil,
      newInner.paper,
      newInner.paperGSM,
      newInner.qty,
      {
        partyName:
          (newBody.partyName as string) ||
          (newBody.companyName as string) ||
          '',
        jobNumber: (newBody.jobNumber as string) || '',
        jobCardId: newBody._id,
        note: 'Deducted for job card',
      },
    );
  }
};
