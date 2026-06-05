import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema()
export class Notification {
  @Prop({
    type: String,
    enum: ['JOB_CREATED', 'JOB_UPDATED', 'PRICE_UPDATED', 'INFO'],
    default: 'INFO',
  })
  type?: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead?: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
