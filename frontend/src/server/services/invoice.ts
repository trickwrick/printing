import { Invoice } from '@/server/models';

export async function saveOrUpdate(body: Record<string, unknown>) {
  const invoiceNumber = body.invoiceNumber as string | undefined;

  if (invoiceNumber) {
    return Invoice.findOneAndUpdate(
      { invoiceNumber },
      { ...body },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  return Invoice.create(body);
}

export async function findAll() {
  return Invoice.find().sort({ createdAt: -1 });
}

export async function update(id: string, body: Record<string, unknown>) {
  const updated = await Invoice.findByIdAndUpdate(id, body, { new: true });
  if (!updated) {
    throw new Error('Invoice not found');
  }
  return updated;
}

export async function remove(id: string) {
  const result = await Invoice.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Invoice not found');
  }
  return { message: 'Invoice deleted successfully' };
}
