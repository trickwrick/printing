import { withDb } from '@/server/api-handler';
import * as paperStockService from '@/server/services/paperStock';

export async function GET(request: Request) {
  return withDb(request, () => paperStockService.findAll());
}

export async function POST(request: Request) {
  return withDb(request, async () => {
    const body = await request.json();
    return paperStockService.create(body);
  });
}
