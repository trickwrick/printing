import { withDb } from '@/server/api-handler';
import * as notificationsService from '@/server/services/notifications';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  return withDb(request, () => notificationsService.remove(id));
}
