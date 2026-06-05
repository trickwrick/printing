import { withDb } from '@/server/api-handler';
import * as settingsService from '@/server/services/settings';

export async function GET() {
  return withDb(() => settingsService.getSettings());
}

export async function POST(request: Request) {
  const body = await request.json();
  return withDb(() => settingsService.saveSettings(body));
}
