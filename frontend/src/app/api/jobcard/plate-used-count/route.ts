import { withDb } from '@/server/api-handler';
import * as jobcardService from '@/server/services/jobcard';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plateSize = searchParams.get('plateSize') || undefined;
  const editingId = searchParams.get('editingId') || undefined;
  return withDb(() => jobcardService.getPlateUsedCount(plateSize, editingId));
}
