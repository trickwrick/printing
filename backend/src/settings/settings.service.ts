import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from '../schemas/setting.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
  ) {}

  async getSettings() {
    let settings = await this.settingModel.findOne();
    if (!settings) {
      settings = await this.settingModel.create({});
    }
    return settings;
  }

  async saveSettings(body: Record<string, unknown>) {
    return this.settingModel.findOneAndUpdate(
      {},
      { ...body, updatedAt: Date.now() },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }
}
