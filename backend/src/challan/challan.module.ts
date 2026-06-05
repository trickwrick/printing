import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Challan, ChallanSchema } from '../schemas/challan.schema';
import { ChallanController } from './challan.controller';
import { ChallanService } from './challan.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Challan.name, schema: ChallanSchema }]),
  ],
  controllers: [ChallanController],
  providers: [ChallanService],
})
export class ChallanModule {}
