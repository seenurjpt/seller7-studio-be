import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type PaymentStatus = 'created' | 'paid' | 'failed';

export interface IPayment {
  user: Types.ObjectId;
  packId: string;
  credits: number;
  /** Amount in paise. */
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  /** Idempotency guard — flipped exactly once when credits are added. */
  creditsGranted: boolean;
}

export type IPaymentDocument = Document & IPayment;

type PaymentModel = Model<IPayment>;

const paymentSchema = new Schema<IPayment, PaymentModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    packId: { type: String, required: true },
    credits: { type: Number, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
      index: true,
    },
    creditsGranted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['razorpaySignature'];
        delete ret['__v'];
        return ret;
      },
    },
  },
);

export const Payment = mongoose.model<IPayment, PaymentModel>('Payment', paymentSchema);
