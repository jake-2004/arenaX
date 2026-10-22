import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const passwordHash = await bcrypt.hash('Password123!', 10);
  await db.collection('users').updateOne(
    { email: 'user@arenax.io' },
    {
      $set: {
        name: 'Rahul',
        password: passwordHash,
        role: 'user',
        is_verified: true
      }
    },
    { upsert: true }
  );

  const u = await db.collection('users').findOne({ email: 'user@arenax.io' });
  console.log('✅ Rahul User account confirmed:');
  console.log('Email:', u.email);
  console.log('Name:', u.name);
  console.log('Password set to: Password123!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
