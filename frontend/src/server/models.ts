import mongoose, { Schema, model, models } from 'mongoose';

const invoiceItemSchema = new Schema(
  {
    description: { type: String, required: true },
    hsn: { type: String, default: '' },
    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false },
);

export const JobCard =
  models.JobCard ||
  model('JobCard', new Schema({}, { strict: false, timestamps: true }));

export const Invoice =
  models.Invoice ||
  model(
    'Invoice',
    new Schema(
      {
        invoiceNumber: { type: String, required: true, unique: true },
        date: { type: Date, default: Date.now },
        jobCard: String,
        orderNo: { type: String, default: '' },
        orderDate: Date,
        partyName: { type: String, required: true },
        items: [invoiceItemSchema],
        subTotal: { type: Number, default: 0 },
        freight: { type: Number, default: 0 },
        reverseCharge: { type: String, default: 'No' },
        gstPercent: { type: Number, default: 0 },
        gstType: { type: String, default: 'CGST/SGST' },
        gstAmount: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        paidAmount: { type: Number, default: 0 },
        paymentStatus: { type: String, default: 'Pending' },
      },
      { timestamps: true },
    ),
  );

export const Challan =
  models.Challan ||
  model(
    'Challan',
    new Schema(
      {
        challanNo: { type: String, required: true, unique: true },
        date: { type: Date, default: Date.now },
        jobCardId: { type: Schema.Types.ObjectId, ref: 'JobCard' },
        jobNumber: String,
        jobName: String,
        partyName: { type: String, required: true },
        description: { type: String, required: true },
        qty: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        note: String,
        paymentStatus: { type: String, default: 'Pending' },
      },
      { timestamps: true },
    ),
  );

export const PaperStock =
  models.PaperStock ||
  model(
    'PaperStock',
    new Schema(
      {
        name: { type: String, required: true, trim: true },
        coverPartyName: String,
        coverName: String,
        innerPartyName: String,
        innerName: String,
        gsm: Number,
        quantity: { type: Number, default: 0 },
        coverGSM: Number,
        coverQuantity: { type: Number, default: 0 },
        coverPaperSize: String,
        innerGSM: Number,
        innerQuantity: { type: Number, default: 0 },
        innerPaperSize: String,
        unit: { type: String, default: 'Sheets' },
        description: String,
        lowStockThreshold: { type: Number, default: 100 },
        paperSource: {
          type: String,
          enum: ['Company paper', 'Party paper'],
          default: 'Company paper',
        },
      },
      { timestamps: true },
    ),
  );

export const PaperStockTransaction =
  models.PaperStockTransaction ||
  model(
    'PaperStockTransaction',
    new Schema(
      {
        paperStockId: { type: Schema.Types.ObjectId, ref: 'PaperStock' },
        stockName: String,
        paperName: String,
        paperType: { type: String, enum: ['cover', 'inner'], required: true },
        transactionType: { type: String, enum: ['add', 'deduct'], required: true },
        quantity: { type: Number, required: true, min: 0 },
        partyName: { type: String, default: '' },
        jobNumber: { type: String, default: '' },
        jobCardId: { type: Schema.Types.ObjectId, ref: 'JobCard' },
        paperSource: { type: String, default: 'Company paper' },
        balanceAfter: { type: Number, default: 0 },
        note: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
      { timestamps: true },
    ),
  );

export const Setting =
  models.Setting ||
  model(
    'Setting',
    new Schema(
      {
        siteTitle: { type: String, default: 'Shree Om Printing Press' },
        adminEmail: String,
        adminMobile: String,
        supportEmail: String,
        supportMobile: String,
        address: String,
        logo: String,
        whiteLogo: String,
        favicon: String,
        updatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true },
    ),
  );

export const Notification =
  models.Notification ||
  model(
    'Notification',
    new Schema({
      type: {
        type: String,
        enum: ['JOB_CREATED', 'JOB_UPDATED', 'PRICE_UPDATED', 'INFO'],
        default: 'INFO',
      },
      message: { type: String, required: true },
      isRead: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    }),
  );

export const PaymentType =
  models.PaymentType ||
  model(
    'PaymentType',
    new Schema(
      {
        name: { type: String, required: true, unique: true },
      },
      { timestamps: true },
    ),
  );

export const Statement =
  models.Statement ||
  model(
    'Statement',
    new Schema(
      {
        invoiceNumber: { type: String, required: true },
        partyName: { type: String, required: true },
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        paymentMethod: { type: String, required: true },
        notes: String,
      },
      { timestamps: true },
    ),
  );

export const User =
  models.User ||
  model(
    'User',
    new Schema(
      {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, default: 'admin' },
      },
      { timestamps: true },
    ),
  );

export const LoginHistory =
  models.LoginHistory ||
  model(
    'LoginHistory',
    new Schema(
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        email: { type: String, required: true },
        ip: String,
        userAgent: String,
        device: String,
        status: { type: String, default: 'success' },
        loginTime: { type: Date, default: Date.now },
      },
      { timestamps: true },
    ),
  );

export type JobCardDoc = mongoose.Document & Record<string, unknown>;
