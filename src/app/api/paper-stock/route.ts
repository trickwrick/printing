import { withDb } from '@/server/api-handler';
import * as paperStockService from '@/server/services/paperStock';

export async function GET() {
  return withDb(() => paperStockService.findAll());
}

export async function POST(request: Request) {
  const body = await request.json();
  return withDb(() => paperStockService.create(body));
}
