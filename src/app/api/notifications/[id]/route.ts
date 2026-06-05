import { withDb } from '@/server/api-handler';
import * as notificationsService from '@/server/services/notifications';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(() => notificationsService.remove(id));
}
