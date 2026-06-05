import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaperStockDocument = HydratedDocument<PaperStock>;

@Schema({ timestamps: true })
export class PaperStock {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  coverPartyName?: string;

  @Prop({ trim: true })
  coverName?: string;

  @Prop({ trim: true })
  innerPartyName?: string;

  @Prop({ trim: true })
  innerName?: string;

  @Prop()
  gsm?: number;

  @Prop({ default: 0 })
  quantity?: number;

  @Prop()
  coverGSM?: number;

  @Prop({ default: 0 })
  coverQuantity?: number;

  @Prop({ trim: true })
  coverPaperSize?: string;

  @Prop()
  innerGSM?: number;

  @Prop({ default: 0 })
  innerQuantity?: number;

  @Prop({ trim: true })
  innerPaperSize?: string;

  @Prop({ default: 'Sheets' })
  unit?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: 100 })
  lowStockThreshold?: number;

  @Prop({
    type: String,
    enum: ['Company paper', 'Party paper'],
    default: 'Company paper',
  })
  paperSource?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const PaperStockSchema = SchemaFactory.createForClass(PaperStock);
