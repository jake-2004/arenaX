import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function updateRahul() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const u = await db.collection('users').findOne({ email: 'user@arenax.io' });
  if (u) {
    await db.collection('users').updateOne(
      { _id: u._id },
      { $set: { name: 'Rahul' } }
    );
    await db.collection('tbl_players').updateOne(
      { numeric_player_id: 100001 },
      { $set: { player_name: 'Rahul', email: 'user@arenax.io', user_id: u._id, verification_status: 'Approved' } }
    );
    console.log('✅ SUCCESS: Updated user@arenax.io user account name to "Rahul" and linked to Player ID #100001!');
  } else {
    console.log('User user@arenax.io not found.');
  }

  process.exit(0);
}

updateRahul().catch(err => {
  console.error(err);
  process.exit(1);
});
