import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type JobCardDocument = HydratedDocument<JobCard>;

@Schema({ timestamps: true })
export class JobCard {
  @Prop({ required: true })
  partyName: string;

  @Prop()
  companyName?: string;

  @Prop()
  address?: string;

  @Prop()
  contactNo?: string;

  @Prop()
  emailId?: string;

  @Prop({ default: '' })
  gstNo?: string;

  @Prop()
  jobName?: string;

  @Prop()
  jobNumber?: string;

  @Prop({ default: '0' })
  jobQty?: string;

  @Prop({ default: Date.now })
  jobDate?: Date;

  @Prop({ default: false })
  useShipAddress?: boolean;

  @Prop({ default: '' })
  shipPartyName?: string;

  @Prop({ default: '' })
  shipAddress?: string;

  @Prop({ default: '' })
  shipContactNo?: string;

  @Prop({ default: '' })
  shipEmailId?: string;

  @Prop({ default: '' })
  shipGstNo?: string;

  @Prop()
  paperType?: string;

  @Prop()
  pageSize?: string;

  @Prop()
  pageCount?: string;

  @Prop({ default: 'No' })
  compose?: string;

  @Prop({ default: 'No' })
  design?: string;

  @Prop({ default: 0 })
  coverPaperCount?: number;

  @Prop()
  coverPaperDetails?: string;

  @Prop()
  innerPaper?: string;

  @Prop({ default: 0 })
  innerPaperCount?: number;

  @Prop()
  innerPaperGSM?: string;

  @Prop()
  innerPaperDetails?: string;

  @Prop({ default: 'Company paper' })
  paperSource?: string;

  @Prop({ default: 'New' })
  plateType?: string;

  @Prop({ default: '0' })
  plateQty?: string;

  @Prop({ default: '0' })
  printingQty?: string;

  @Prop()
  lamination?: string;

  @Prop({ default: false })
  bindingCenterPin?: boolean;

  @Prop({ default: false })
  bindingSilai?: boolean;

  @Prop({ default: false })
  bindingSidePin?: boolean;

  @Prop({ default: false })
  bindingFolding?: boolean;

  @Prop({ default: false })
  bindingPerforation?: boolean;

  @Prop({ default: false })
  bindingNumbring?: boolean;

  @Prop({ default: false })
  bindingRegister?: boolean;

  @Prop()
  controlPrint?: string;

  @Prop()
  paper?: string;

  @Prop()
  printingUC?: string;

  @Prop()
  printingType?: string;

  @Prop({ default: 0 })
  printingPrice?: number;

  @Prop()
  bindingNo?: string;

  @Prop()
  bindingNote?: string;

  @Prop()
  filePath?: string;

  @Prop()
  plateSize?: string;

  @Prop()
  plateUseCount?: number;

  @Prop()
  plateNo?: string;

  @Prop({ default: 0 })
  platePrice?: number;

  @Prop()
  plateFrom?: string;

  @Prop()
  paperFrom?: string;

  @Prop()
  paperSize?: string;

  @Prop()
  cuttingSize?: string;

  @Prop()
  paperGSM?: string;

  @Prop()
  printSheet?: string;

  @Prop()
  folding?: string;

  @Prop({ type: [Number] })
  jobColor?: number[];

  @Prop({ default: 0 })
  jobCounter?: number;

  @Prop({ default: 0 })
  totalAmount?: number;

  @Prop()
  notes?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const JobCardSchema = SchemaFactory.createForClass(JobCard);
