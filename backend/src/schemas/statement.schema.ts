import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StatementDocument = HydratedDocument<Statement>;

@Schema({ timestamps: true })
export class Statement {
  @Prop({ required: true })
  invoiceNumber: string;

  @Prop({ required: true })
  partyName: string;

  @Prop({ default: Date.now })
  date?: Date;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop()
  notes?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const StatementSchema = SchemaFactory.createForClass(Statement);
