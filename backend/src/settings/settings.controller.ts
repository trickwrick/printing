import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    try {
      return await this.settingsService.getSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async saveSettings(@Body() body: Record<string, unknown>) {
    try {
      return await this.settingsService.saveSettings(body);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
