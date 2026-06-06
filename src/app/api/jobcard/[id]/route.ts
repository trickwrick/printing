import { withDb } from '@/server/api-handler';
import * as jobcardService from '@/server/services/jobcard';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(request, () => jobcardService.findOne(id));
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(request, () => jobcardService.remove(id));
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(request, async () => {
    const body = await request.json();
    return jobcardService.saveOrUpdate(body, id);
  });
}
