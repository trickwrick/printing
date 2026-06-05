import { withDb } from '@/server/api-handler';
import * as paymentTypeService from '@/server/services/paymentType';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  return withDb(() => paymentTypeService.update(id, body.name));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(() => paymentTypeService.remove(id));
}
