import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/arenax');
  const db = mongoose.connection.db;
  const hash = await bcrypt.hash('Password123!', 10);
  await db.collection('users').updateOne({ email: 'jake@gmail.com' }, { $set: { password: hash } });
  await db.collection('tbl_users').updateOne({ email: 'jake@gmail.com' }, { $set: { password: hash } });
  console.log('Password for jake@gmail.com updated to Password123!');
  process.exit(0);
}
run();
