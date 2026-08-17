const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const uri = 'mongodb+srv://rok4ktr_db_user:4TRDCRWcsIJZyMfD@cluster0.v9totu2.mongodb.net/tufail_portfolio?appName=Cluster0';

const AdminSchema = new mongoose.Schema({
  name: { type: String, default: 'Md Tufail', trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  refreshTokens: [
    {
      tokenHash: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
    },
  ],
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Date },
}, { timestamps: true });

AdminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

AdminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

AdminSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

AdminSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function testLogin() {
  await mongoose.connect(uri);
  const email = 'admin@tufail.dev';
  const password = 'admin123';

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  console.log('Admin found:', admin ? admin.email : 'None');
  if (!admin) return;

  console.log('isLocked:', admin.isLocked());
  const isValid = await admin.comparePassword(password);
  console.log('Password valid?:', isValid);

  if (isValid) {
    await admin.resetLoginAttempts();
    console.log('Reset login attempts done');

    const ACCESS_SECRET = 'tufail_jwt_access_super_secret_key_2026_x8923';
    const REFRESH_SECRET = 'tufail_jwt_refresh_ultra_secret_key_2026_z9184';

    const accessToken = jwt.sign({ userId: admin._id.toString(), role: admin.role }, ACCESS_SECRET, { expiresIn: '15m' });
    const tokenId = crypto.randomUUID();
    const refreshToken = jwt.sign({ userId: admin._id.toString(), tokenId }, REFRESH_SECRET, { expiresIn: '14d' });
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const now = new Date();
    admin.refreshTokens = (admin.refreshTokens || []).filter(rt => new Date(rt.expiresAt) > now);
    admin.refreshTokens.push({ tokenHash, createdAt: now, expiresAt });
    await admin.save();
    console.log('Admin saved successfully with refresh token!');
  }
  process.exit(0);
}

testLogin().catch(err => {
  console.error('Error during testLogin:', err);
  process.exit(1);
});
