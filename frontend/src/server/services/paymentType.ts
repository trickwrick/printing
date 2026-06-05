import { PaymentType } from '@/server/models';

export async function create(name: string) {
  if (!name) {
    throw new Error('Name is required');
  }
  return PaymentType.create({ name });
}

export async function findAll() {
  return PaymentType.find().sort({ name: 1 });
}

export async function update(id: string, name: string) {
  const payment = await PaymentType.findByIdAndUpdate(
    id,
    { name, updatedAt: Date.now() },
    { new: true },
  );
  if (!payment) {
    throw new Error('Payment Type not found');
  }
  return payment;
}

export async function remove(id: string) {
  const result = await PaymentType.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Payment Type not found');
  }
  return { message: 'Payment Type deleted successfully' };
}
