import { withDb } from '@/server/api-handler';
import * as notificationsService from '@/server/services/notifications';

export async function PUT() {
  return withDb(() => notificationsService.markAllRead());
}
