import { withDb } from '@/server/api-handler';
import * as challanService from '@/server/services/challan';

export async function GET(request: Request) {
  return withDb(request, () => challanService.findAll());
}

export async function POST(request: Request) {
  return withDb(request, async () => {
    const body = await request.json();
    return challanService.saveOrUpdate(body);
  });
}
