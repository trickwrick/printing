import { withDb } from '@/server/api-handler';
import * as paperStockService from '@/server/services/paperStock';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(request, async () => {
    const body = await request.json();
    return paperStockService.update(id, body);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(request, () => paperStockService.remove(id));
}
