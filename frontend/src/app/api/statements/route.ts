import { withDb } from '@/server/api-handler';
import * as statementsService from '@/server/services/statements';

export async function GET() {
  return withDb(() => statementsService.findAll());
}

export async function POST(request: Request) {
  const body = await request.json();
  return withDb(() => statementsService.create(body));
}
