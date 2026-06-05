import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChallanDocument = HydratedDocument<Challan>;

@Schema({ timestamps: true })
export class Challan {
  @Prop({ required: true, unique: true })
  challanNo: string;

  @Prop({ default: Date.now })
  date?: Date;

  @Prop({ type: Types.ObjectId, ref: 'JobCard' })
  jobCardId?: Types.ObjectId;

  @Prop()
  jobNumber?: string;

  @Prop()
  jobName?: string;

  @Prop({ required: true })
  partyName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 0 })
  qty?: number;

  @Prop({ default: 0 })
  rate?: number;

  @Prop({ default: 0 })
  total?: number;

  @Prop()
  note?: string;

  @Prop({ default: 'Pending' })
  paymentStatus?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const ChallanSchema = SchemaFactory.createForClass(Challan);
