import { withDb } from '@/server/api-handler';
import * as settingsService from '@/server/services/settings';

export async function GET(request: Request) {
  return withDb(request, () => settingsService.getSettings());
}

export async function POST(request: Request) {
  return withDb(request, async () => {
    const body = await request.json();
    return settingsService.saveSettings(body);
  });
}
