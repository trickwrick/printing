import { withDb } from '@/server/api-handler';
import * as jobcardService from '@/server/services/jobcard';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(() => jobcardService.findOne(id));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(() => jobcardService.remove(id));
}
