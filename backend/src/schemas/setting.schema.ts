import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingDocument = HydratedDocument<Setting>;

@Schema({ timestamps: true })
export class Setting {
  @Prop({ default: 'Krishna Printers' })
  siteTitle?: string;

  @Prop()
  adminEmail?: string;

  @Prop()
  adminMobile?: string;

  @Prop()
  supportEmail?: string;

  @Prop()
  supportMobile?: string;

  @Prop()
  address?: string;

  @Prop()
  logo?: string;

  @Prop()
  whiteLogo?: string;

  @Prop()
  favicon?: string;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
