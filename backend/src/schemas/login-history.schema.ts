import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LoginHistoryDocument = HydratedDocument<LoginHistory>;

@Schema({ timestamps: true })
export class LoginHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  email: string;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  device?: string;

  @Prop({ default: 'success' })
  status?: string;

  @Prop({ default: Date.now })
  loginTime?: Date;
}

export const LoginHistorySchema = SchemaFactory.createForClass(LoginHistory);
