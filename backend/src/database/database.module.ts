import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const uri = configService.get<string>('MONGO_URI');
            console.log('------------------------------------------');
            console.log(
              `📡 Database: ${uri ? 'configured' : 'not configured (add backend/.env when ready)'}`,
            );
            console.log('------------------------------------------');

            if (!uri) {
              console.warn(
                '⚠️ MONGO_URI not set — server running without database',
              );
              return {
                uri: 'mongodb://127.0.0.1:27017/__crm_no_db__',
                lazyConnection: true,
              };
            }

            return { uri };
          },
        }),
      ],
    };
  }
}
