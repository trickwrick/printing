import { withDb } from '@/server/api-handler';
import * as jobcardService from '@/server/services/jobcard';

export async function GET(request: Request) {
  return withDb(request, () => jobcardService.findAll());
}

export async function POST(request: Request) {
  return withDb(request, async () => {
    const body = await request.json();
    return jobcardService.saveOrUpdate(body);
  });
}
