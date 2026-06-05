import { Invoice, Statement } from '@/server/models';

export async function findAll() {
  return Statement.find().sort({ date: -1 });
}

export async function create(body: Record<string, unknown>) {
  const invoiceNumber = body.invoiceNumber as string | undefined;
  const partyName = body.partyName as string | undefined;
  const date = body.date as Date | undefined;
  const amount = body.amount as number | string | undefined;
  const paymentMethod = body.paymentMethod as string | undefined;
  const notes = body.notes as string | undefined;

  if (!invoiceNumber || !amount || !paymentMethod) {
    throw new Error('Invoice Number, Amount, and Method are required');
  }

  const newStatement = await Statement.create({
    invoiceNumber,
    partyName,
    date: date || new Date(),
    amount: Number(amount),
    paymentMethod,
    notes,
  });

  const invoice = await Invoice.findOne({ invoiceNumber });
  if (invoice) {
    invoice.paidAmount = (invoice.paidAmount || 0) + Number(amount);
    await invoice.save();
  }

  return newStatement;
}

export async function remove(id: string) {
  const statement = await Statement.findById(id);
  if (!statement) {
    throw new Error('Statement not found');
  }

  const invoice = await Invoice.findOne({
    invoiceNumber: statement.invoiceNumber,
  });
  if (invoice) {
    invoice.paidAmount = Math.max(
      0,
      (invoice.paidAmount || 0) - statement.amount,
    );
    await invoice.save();
  }

  await Statement.findByIdAndDelete(id);
  return { message: 'Statement deleted and invoice updated successfully' };
}
