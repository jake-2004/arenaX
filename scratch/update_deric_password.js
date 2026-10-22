import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const hash = await bcrypt.hash('Password123!', 10);
  const r1 = await mongoose.connection.db.collection('users').updateOne(
    { email: 'deric@gmail.com' },
    { $set: { password: hash } }
  );
  const r2 = await mongoose.connection.db.collection('tbl_users').updateOne(
    { email: 'deric@gmail.com' },
    { $set: { password: hash } }
  );
  console.log('Password updated for deric@gmail.com to Password123!. Results:', { users: r1.modifiedCount, tbl_users: r2.modifiedCount });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
