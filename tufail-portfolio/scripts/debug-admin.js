const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://rok4ktr_db_user:4TRDCRWcsIJZyMfD@cluster0.v9totu2.mongodb.net/tufail_portfolio?appName=Cluster0';

// Replicate the exact Admin schema
const AdminSchema = new mongoose.Schema({
  name: { type: String, default: 'Md Tufail', trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  refreshTokens: [{ tokenHash: String, createdAt: Date, expiresAt: Date }],
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
}, { timestamps: true });

async function test() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected');

  const Admin = mongoose.model('Admin', AdminSchema);

  // Test 1: Mongoose document
  const doc = await Admin.findOne({ email: 'admin@tufail.dev' });
  console.log('\n--- Mongoose Document ---');
  console.log('isActive:', doc.isActive, '| typeof:', typeof doc.isActive);
  console.log('role:', doc.role, '| typeof:', typeof doc.role);
  console.log('!isActive:', !doc.isActive);

  // Test 2: Lean (plain object)
  const lean = await Admin.findOne({ email: 'admin@tufail.dev' }).lean();
  console.log('\n--- Lean Document ---');
  console.log('isActive:', lean.isActive, '| typeof:', typeof lean.isActive);
  console.log('role:', lean.role, '| typeof:', typeof lean.role);
  console.log('!isActive:', !lean.isActive);

  // Test 3: Raw driver
  const raw = await mongoose.connection.db.collection('admins').findOne({ email: 'admin@tufail.dev' });
  console.log('\n--- Raw MongoDB Driver ---');
  console.log('isActive:', raw.isActive, '| typeof:', typeof raw.isActive);
  console.log('role:', raw.role, '| typeof:', typeof raw.role);
  console.log('!isActive:', !raw.isActive);

  // Test 4: bcrypt
  const match = await bcrypt.compare('admin123', lean.password);
  console.log('\n--- bcrypt ---');
  console.log('compare("admin123"):', match);

  // Test 5: All fields
  console.log('\n--- ALL fields (lean) ---');
  console.log(JSON.stringify(lean, null, 2));

  await mongoose.disconnect();
}

test().catch(err => { console.error(err); process.exit(1); });
