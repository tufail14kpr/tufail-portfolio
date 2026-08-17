const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://rok4ktr_db_user:4TRDCRWcsIJZyMfD@cluster0.v9totu2.mongodb.net/tufail_portfolio?appName=Cluster0';

async function resetAdmin() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const admins = db.collection('admins');

  // Hash the password fresh
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  // Update or upsert the admin
  const result = await admins.updateOne(
    { email: 'admin@tufail.dev' },
    {
      $set: {
        password: hashedPassword,
        loginAttempts: 0,
        isActive: true,
        role: 'admin',
        refreshTokens: [],
      },
      $unset: { lockUntil: '' },
    }
  );

  console.log('Update result:', result);

  // Verify it worked
  const admin = await admins.findOne({ email: 'admin@tufail.dev' });
  console.log('Admin email:', admin.email);
  console.log('Password starts with $2:', admin.password.startsWith('$2'));
  console.log('loginAttempts:', admin.loginAttempts);
  console.log('lockUntil:', admin.lockUntil);
  console.log('isActive:', admin.isActive);

  // Final bcrypt verify
  const match = await bcrypt.compare('admin123', admin.password);
  console.log('bcrypt.compare("admin123") =', match);

  await mongoose.disconnect();
  console.log('\n✅ Admin reset complete!');
}

resetAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
