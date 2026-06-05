import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getConnectionToken(),
          useValue: { readyState: 0 },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return active health status', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('Active');
      expect(result.database).toBe('Disconnected');
    });
  });

  describe('ping', () => {
    it('should return awake message', () => {
      expect(appController.ping()).toBe('I am awake!');
    });
  });
});
