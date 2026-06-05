import { withDb } from '@/server/api-handler';
import * as authService from '@/server/services/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password } = body;
  return withDb(() => authService.signup(name, email, password));
}
