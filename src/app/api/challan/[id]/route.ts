import { withDb } from '@/server/api-handler';
import * as challanService from '@/server/services/challan';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  return withDb(() => challanService.update(id, body));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(() => challanService.remove(id));
}
