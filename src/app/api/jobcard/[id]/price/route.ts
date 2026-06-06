import { withDb } from '@/server/api-handler';
import * as jobcardService from '@/server/services/jobcard';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(request, async () => {
    const body = await request.json();
    return jobcardService.updatePrice(id, body.totalAmount);
  });
}
