import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Guarantee John's user account
  await db.collection('users').updateOne(
    { email: 'john@gmail.com' },
    {
      $set: {
        name: 'JOHN',
        email: 'john@gmail.com',
        password: passwordHash,
        role: 'user',
        numeric_player_id: 100002,
        is_verified: true
      }
    },
    { upsert: true }
  );

  const u = await db.collection('users').findOne({ email: 'john@gmail.com' });

  // Guarantee John's player profile
  await db.collection('tbl_players').updateOne(
    { numeric_player_id: 100002 },
    {
      $set: {
        numeric_player_id: 100002,
        player_name: 'JOHN',
        email: 'john@gmail.com',
        user_id: u?._id,
        sport: 'Football',
        position: 'Midfielder',
        jersey_number: '7',
        verification_status: 'Approved',
        id_proof_type: 'Aadhaar Card',
        id_proof_number: '123456789012'
      }
    },
    { upsert: true }
  );

  console.log('✅ JOHN USER ACCOUNT CONFIRMED:');
  console.log('Email:', u.email);
  console.log('Name:', u.name);
  console.log('Password set to: Password123!');
  console.log('Player ID: #100002');

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
