import { withDb } from '@/server/api-handler';
import * as paymentTypeService from '@/server/services/paymentType';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(request, async () => {
    const body = await request.json();
    return paymentTypeService.update(id, body.name);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(request, () => paymentTypeService.remove(id));
}
