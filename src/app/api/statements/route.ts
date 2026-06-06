import { withDb } from '@/server/api-handler';
import * as statementsService from '@/server/services/statements';

export async function GET(request: Request) {
  return withDb(request, () => statementsService.findAll());
}

export async function POST(request: Request) {
  return withDb(request, async () => {
    const body = await request.json();
    return statementsService.create(body);
  });
}
