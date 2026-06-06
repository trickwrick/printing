import { withDb } from '@/server/api-handler';
import * as paymentTypeService from '@/server/services/paymentType';

export async function GET(request: Request) {
  return withDb(request, () => paymentTypeService.findAll());
}

export async function POST(request: Request) {
  return withDb(request, async () => {
    const body = await request.json();
    return paymentTypeService.create(body.name);
  });
}
