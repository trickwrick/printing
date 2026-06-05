import { withDb } from '@/server/api-handler';
import * as authService from '@/server/services/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined;
  const userAgent = request.headers.get('user-agent') || undefined;
  return withDb(() => authService.login(email, password, ip, userAgent));
}
