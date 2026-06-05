import { withDb } from '@/server/api-handler';
import * as invoiceService from '@/server/services/invoice';

export async function GET() {
  return withDb(() => invoiceService.findAll());
}

export async function POST(request: Request) {
  const body = await request.json();
  return withDb(() => invoiceService.saveOrUpdate(body));
}
