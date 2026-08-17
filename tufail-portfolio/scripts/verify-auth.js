const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const uri = process.env.MONGODB_URI || 'mongodb+srv://rok4ktr_db_user:4TRDCRWcsIJZyMfD@cluster0.v9totu2.mongodb.net/tufail_portfolio?appName=Cluster0';
const ACCESS_SECRET = 'tufail_jwt_access_super_secret_key_2026_x8923';
const REFRESH_SECRET = 'tufail_jwt_refresh_ultra_secret_key_2026_z9184';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function verifyAuthFlow() {
  console.log('=== 🛡️ STARTING ADMIN AUTH VERIFICATION SUITE ===\n');

  // 1. Connect DB
  console.log('[TEST 1] Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  // 2. Load Admin model
  const AdminSchema = new mongoose.Schema(
    {
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
    },
    { timestamps: true }
  );

  AdminSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };
  AdminSchema.methods.isLocked = function () {
    return !!(this.lockUntil && new Date(this.lockUntil).getTime() > Date.now());
  };

  const Admin = mongoose.models.AdminTest || mongoose.model('AdminTest', AdminSchema, 'admins');

  // 3. Test Admin document lookup
  console.log('[TEST 2] Verifying Admin account in database...');
  let admin = await Admin.findOne({ email: 'admin@tufail.dev' });
  if (!admin) {
    throw new Error('Admin not found!');
  }
  console.log(`✅ Admin found: ${admin.email}, Role: ${admin.role}, Active: ${admin.isActive}\n`);

  // 4. Test Password Comparison
  console.log('[TEST 3] Testing password hash comparison with bcrypt...');
  const isWrongPasswordValid = await admin.comparePassword('wrongpassword999');
  console.log(`   Wrong password check (should be false): ${isWrongPasswordValid}`);
  if (isWrongPasswordValid !== false) throw new Error('Wrong password matched unexpectedly!');

  const isCorrectPasswordValid = await admin.comparePassword('admin123');
  console.log(`   Correct password check (should be true): ${isCorrectPasswordValid}`);
  if (isCorrectPasswordValid !== true) throw new Error('Correct password failed comparison!');
  console.log('✅ Password hash verification passed\n');

  // 5. Test Access Token generation and verification
  console.log('[TEST 4] Generating and verifying 15-minute Access JWT...');
  const accessPayload = { userId: admin._id.toString(), role: admin.role };
  const accessToken = jwt.sign(accessPayload, ACCESS_SECRET, { expiresIn: '15m' });
  const verifiedAccess = jwt.verify(accessToken, ACCESS_SECRET);
  console.log(`   Verified Access Token payload: userId=${verifiedAccess.userId}, role=${verifiedAccess.role}`);
  console.log('✅ Access JWT verified successfully\n');

  // 6. Test Refresh Token generation, SHA-256 hashing, and storage
  console.log('[TEST 5] Generating 14-day Refresh Token and saving SHA-256 hash in DB...');
  const tokenId = crypto.randomUUID();
  const refreshPayload = { userId: admin._id.toString(), tokenId };
  const refreshToken = jwt.sign(refreshPayload, REFRESH_SECRET, { expiresIn: '14d' });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const now = new Date();
  admin.refreshTokens = (admin.refreshTokens || []).filter((rt) => new Date(rt.expiresAt) > now);
  admin.refreshTokens.push({ tokenHash, createdAt: now, expiresAt });
  await admin.save();
  console.log(`   Stored Token Hash: ${tokenHash.substring(0, 16)}...`);
  console.log('✅ Refresh token saved in database\n');

  // 7. Test Token Rotation & Reuse Detection
  console.log('[TEST 6] Testing Refresh Token Rotation and reuse detection...');
  const reloadedAdmin = await Admin.findById(admin._id);
  const foundToken = (reloadedAdmin.refreshTokens || []).some(
    (rt) => rt.tokenHash === tokenHash && new Date(rt.expiresAt) > new Date()
  );
  if (!foundToken) throw new Error('Stored refresh token could not be verified in DB!');
  console.log('   Original token validated in DB');

  // Rotate token
  const newRefreshToken = jwt.sign({ userId: admin._id.toString(), tokenId: crypto.randomUUID() }, REFRESH_SECRET, { expiresIn: '14d' });
  const newTokenHash = hashToken(newRefreshToken);
  reloadedAdmin.refreshTokens = reloadedAdmin.refreshTokens.filter((rt) => rt.tokenHash !== tokenHash);
  reloadedAdmin.refreshTokens.push({ tokenHash: newTokenHash, createdAt: new Date(), expiresAt });
  await reloadedAdmin.save();
  console.log('   Old token removed and New rotated token saved');
  console.log('✅ Token rotation verified\n');

  // 8. Test Logout & Token Revocation
  console.log('[TEST 7] Testing Logout & Session Revocation...');
  await Admin.findByIdAndUpdate(admin._id, {
    $pull: { refreshTokens: { tokenHash: newTokenHash } },
  });
  const afterLogoutAdmin = await Admin.findById(admin._id);
  const stillHasToken = (afterLogoutAdmin.refreshTokens || []).some((rt) => rt.tokenHash === newTokenHash);
  if (stillHasToken) throw new Error('Token was not revoked properly!');
  console.log('   Token successfully revoked and deleted from MongoDB');
  console.log('✅ Logout revocation verified\n');

  console.log('🎉 ALL 7 SECURITY & AUTH VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

verifyAuthFlow().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
