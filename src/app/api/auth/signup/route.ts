import { withDb } from '@/server/api-handler';
import * as authService from '@/server/services/auth';

export async function POST(request: Request) {
  return withDb(request, async () => {
    const body = await request.json();
    const { name, email, password } = body;
    return authService.signup(name, email, password);
  });
}
