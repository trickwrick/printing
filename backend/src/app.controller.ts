import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get('api/health')
  getHealth() {
    return {
      status: 'Active',
      database:
        this.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      message: 'CRM API running stable 🚀',
    };
  }

  @Get('ping')
  ping() {
    return this.appService.ping();
  }
}
