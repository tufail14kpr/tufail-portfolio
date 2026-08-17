const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://rok4ktr_db_user:4TRDCRWcsIJZyMfD@cluster0.v9totu2.mongodb.net/tufail_portfolio?appName=Cluster0';

async function inspect() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const admins = db.collection('admins');

  // Find ALL admin documents
  const allAdmins = await admins.find({}).toArray();
  console.log(`Total admin documents: ${allAdmins.length}\n`);

  for (const admin of allAdmins) {
    console.log('--- Admin Record ---');
    console.log('  _id:', admin._id.toString());
    console.log('  email:', admin.email);
    console.log('  role:', JSON.stringify(admin.role));
    console.log('  isActive:', admin.isActive);
    console.log('  loginAttempts:', admin.loginAttempts);
    console.log('  lockUntil:', admin.lockUntil);
    console.log('  password starts with $2:', admin.password?.startsWith('$2'));
    
    // Test bcrypt
    const match = await bcrypt.compare('admin123', admin.password);
    console.log('  bcrypt.compare("admin123"):', match);
    console.log('');
  }

  await mongoose.disconnect();
}

inspect().catch(err => { console.error(err); process.exit(1); });
