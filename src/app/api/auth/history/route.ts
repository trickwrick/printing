import { withDb } from '@/server/api-handler';
import * as authService from '@/server/services/auth';

export async function GET(request: Request) {
  return withDb(request, () => authService.getHistory());
}
