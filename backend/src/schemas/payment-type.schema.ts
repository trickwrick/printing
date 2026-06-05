import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentTypeDocument = HydratedDocument<PaymentType>;

@Schema({ timestamps: true })
export class PaymentType {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const PaymentTypeSchema = SchemaFactory.createForClass(PaymentType);
