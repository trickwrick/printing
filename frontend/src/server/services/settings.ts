import { Setting } from '@/server/models';

export async function getSettings() {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({});
  }
  return settings;
}

export async function saveSettings(body: Record<string, unknown>) {
  return Setting.findOneAndUpdate(
    {},
    { ...body, updatedAt: Date.now() },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}
