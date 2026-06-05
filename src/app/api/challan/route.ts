import { withDb } from '@/server/api-handler';
import * as challanService from '@/server/services/challan';

export async function GET() {
  return withDb(() => challanService.findAll());
}

export async function POST(request: Request) {
  const body = await request.json();
  return withDb(() => challanService.saveOrUpdate(body));
}
