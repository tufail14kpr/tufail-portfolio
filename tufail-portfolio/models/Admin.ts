import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IRefreshToken {
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
  refreshTokens: IRefreshToken[];
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes lock

const AdminSchema: Schema = new Schema(
  {
    name: { type: String, default: 'Md Tufail', trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshTokens: [
      {
        tokenHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
      },
    ],
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before saving if modified
AdminSchema.pre('save', async function (this: any) {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare candidate password against stored bcrypt hash safely
AdminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password || !candidatePassword) return false;
  if (!this.password.startsWith('$2')) {
    return this.password === candidatePassword;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is temporarily locked due to failed attempts
AdminSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && new Date(this.lockUntil).getTime() > Date.now());
};

// Handle failed login attempt safely
AdminSchema.methods.incLoginAttempts = async function (this: any): Promise<void> {
  try {
    const isCurrentlyLocked = this.lockUntil && new Date(this.lockUntil).getTime() > Date.now();
    if (this.lockUntil && new Date(this.lockUntil).getTime() <= Date.now()) {
      this.loginAttempts = 1;
      this.lockUntil = undefined;
      await this.updateOne({
        $set: { loginAttempts: 1 },
        $unset: { lockUntil: 1 },
      });
      return;
    }

    const nextAttempts = (this.loginAttempts || 0) + 1;
    this.loginAttempts = nextAttempts;

    const updates: any = { $inc: { loginAttempts: 1 } };
    if (nextAttempts >= MAX_LOGIN_ATTEMPTS && !isCurrentlyLocked) {
      const lockTime = new Date(Date.now() + LOCK_TIME);
      this.lockUntil = lockTime;
      updates.$set = { lockUntil: lockTime };
    }

    await this.updateOne(updates);
  } catch (err) {
    console.error('[INC_ATTEMPTS_ERROR]', err);
  }
};

// Reset login attempts on successful login
AdminSchema.methods.resetLoginAttempts = async function (this: any): Promise<void> {
  try {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    await this.updateOne({
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 },
    });
  } catch (err) {
    console.error('[RESET_ATTEMPTS_ERROR]', err);
  }
};

const Admin: Model<IAdmin> = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;
