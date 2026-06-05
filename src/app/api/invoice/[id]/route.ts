import { withDb } from '@/server/api-handler';
import * as invoiceService from '@/server/services/invoice';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  return withDb(() => invoiceService.update(id, body));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(() => invoiceService.remove(id));
}
