import { withDb } from '@/server/api-handler';
import * as jobcardService from '@/server/services/jobcard';

export async function GET() {
  return withDb(() => jobcardService.findAll());
}

export async function POST(request: Request) {
  const body = await request.json();
  return withDb(() => jobcardService.saveOrUpdate(body));
}
