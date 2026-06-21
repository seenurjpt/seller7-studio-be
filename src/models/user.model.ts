import mongoose, { Document, Schema, Model } from 'mongoose';
import bcryptjs from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../config/constants';

export interface IUser {
  email: string;
  password: string;
  name: string;
  isEmailVerified: boolean;
  refreshTokenHash?: string;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
}

export interface IUserMethods {
  comparePassword(plain: string): Promise<boolean>;
}

export type IUserDocument = Document & IUser & IUserMethods;

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['password'];
        delete ret['refreshTokenHash'];
        delete ret['passwordResetTokenHash'];
        delete ret['passwordResetExpires'];
        delete ret['__v'];
        return ret;
      },
    },
  },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcryptjs.hash(this.password, BCRYPT_ROUNDS);
});

userSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  return bcryptjs.compare(plain, this.password);
};

export const User = mongoose.model<IUser, UserModel>('User', userSchema);
