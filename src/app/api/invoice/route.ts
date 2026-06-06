import { withDb } from '@/server/api-handler';
import * as invoiceService from '@/server/services/invoice';

export async function GET(request: Request) {
  return withDb(request, () => invoiceService.findAll());
}

export async function POST(request: Request) {
  return withDb(request, async () => {
    const body = await request.json();
    return invoiceService.saveOrUpdate(body);
  });
}
