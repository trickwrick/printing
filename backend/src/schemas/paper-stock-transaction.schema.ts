import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaperStockTransactionDocument =
  HydratedDocument<PaperStockTransaction>;

@Schema({ timestamps: true })
export class PaperStockTransaction {
  @Prop({ type: Types.ObjectId, ref: 'PaperStock' })
  paperStockId?: Types.ObjectId;

  @Prop({ trim: true })
  stockName?: string;

  @Prop({ trim: true })
  paperName?: string;

  @Prop({ type: String, enum: ['cover', 'inner'], required: true })
  paperType: string;

  @Prop({ type: String, enum: ['add', 'deduct'], required: true })
  transactionType: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ trim: true, default: '' })
  partyName?: string;

  @Prop({ trim: true, default: '' })
  jobNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'JobCard' })
  jobCardId?: Types.ObjectId;

  @Prop({ default: 'Company paper' })
  paperSource?: string;

  @Prop({ default: 0 })
  balanceAfter?: number;

  @Prop({ trim: true, default: '' })
  note?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;
}

export const PaperStockTransactionSchema = SchemaFactory.createForClass(
  PaperStockTransaction,
);
