import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ _id: false })
export class InvoiceItem {
  @Prop({ required: true })
  description: string;

  @Prop({ default: '' })
  hsn?: string;

  @Prop({ default: 0 })
  qty?: number;

  @Prop({ default: 0 })
  rate?: number;

  @Prop({ default: 0 })
  total?: number;
}

export const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, unique: true })
  invoiceNumber: string;

  @Prop({ default: Date.now })
  date?: Date;

  @Prop()
  jobCard?: string;

  @Prop({ default: '' })
  orderNo?: string;

  @Prop()
  orderDate?: Date;

  @Prop({ required: true })
  partyName: string;

  @Prop({ type: [InvoiceItemSchema] })
  items?: InvoiceItem[];

  @Prop({ default: 0 })
  subTotal?: number;

  @Prop({ default: 0 })
  freight?: number;

  @Prop({ default: 'No' })
  reverseCharge?: string;

  @Prop({ default: 0 })
  gstPercent?: number;

  @Prop({ default: 'CGST/SGST' })
  gstType?: string;

  @Prop({ default: 0 })
  gstAmount?: number;

  @Prop({ default: 0 })
  totalAmount?: number;

  @Prop({ default: 0 })
  paidAmount?: number;

  @Prop({ default: 'Pending' })
  paymentStatus?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
