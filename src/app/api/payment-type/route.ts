import { withDb } from '@/server/api-handler';
import * as paymentTypeService from '@/server/services/paymentType';

export async function GET() {
  return withDb(() => paymentTypeService.findAll());
}

export async function POST(request: Request) {
  const body = await request.json();
  return withDb(() => paymentTypeService.create(body.name));
}
