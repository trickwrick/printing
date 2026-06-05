import { Challan } from '@/server/models';

export async function saveOrUpdate(body: Record<string, unknown>) {
  const challanNo = body.challanNo as string | undefined;

  if (challanNo) {
    return Challan.findOneAndUpdate(
      { challanNo },
      { ...body },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  return Challan.create(body);
}

export async function findAll() {
  return Challan.find().sort({ createdAt: -1 });
}

export async function update(id: string, body: Record<string, unknown>) {
  const updated = await Challan.findByIdAndUpdate(id, body, { new: true });
  if (!updated) {
    throw new Error('Challan not found');
  }
  return updated;
}

export async function remove(id: string) {
  const result = await Challan.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Challan not found');
  }
  return { message: 'Challan deleted successfully' };
}
