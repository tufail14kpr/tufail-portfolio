/**
 * Admin Seeding CLI Script for Md Tufail's Portfolio
 * Usage:
 *   node scripts/seed-admin.js [email] [password] [name] [role]
 * Example:
 *   node scripts/seed-admin.js admin@tufail.dev mySecurePassword123 "Md Tufail" admin
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env if present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim();
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env');
  process.exit(1);
}

const email = (process.argv[2] || process.env.ADMIN_DEFAULT_EMAIL || 'admin@tufail.dev').toLowerCase().trim();
const password = process.argv[3] || process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
const name = process.argv[4] || 'Md Tufail';
const role = process.argv[5] || 'admin';

async function seedAdmin() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas.');

    const AdminCollection = mongoose.connection.collection('admins');

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const existingAdmin = await AdminCollection.findOne({ email });

    if (existingAdmin) {
      await AdminCollection.updateOne(
        { email },
        {
          $set: {
            name,
            password: hashedPassword,
            role,
            isActive: true,
            loginAttempts: 0,
            updatedAt: new Date(),
          },
          $unset: { lockUntil: 1 },
        }
      );
      console.log(`\n🎉 Admin account successfully UPDATED!`);
    } else {
      await AdminCollection.insertOne({
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
        refreshTokens: [],
        loginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`\n🎉 Admin account successfully CREATED!`);
    }

    console.log(`-----------------------------------`);
    console.log(`👤 Name:  ${name}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Role:  ${role}`);
    console.log(`🔒 Status: Active`);
    console.log(`-----------------------------------\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
