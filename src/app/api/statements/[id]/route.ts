import { withDb } from '@/server/api-handler';
import * as statementsService from '@/server/services/statements';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(request, () => statementsService.remove(id));
}
