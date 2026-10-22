import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Delete all players where numeric_player_id is missing/null/undefined
  const res = await db.collection('tbl_players').deleteMany({
    $or: [
      { numeric_player_id: { $exists: false } },
      { numeric_player_id: null },
      { numeric_player_id: undefined }
    ]
  });
  console.log(`🧹 Cleaned up ${res.deletedCount} orphaned player records from tbl_players`);

  const players = await db.collection('tbl_players').find({}).toArray();
  console.log('\n--- CLEAN MASTER PLAYERS IN DATABASE ---');
  for (const p of players) {
    console.log(`✅ ID: #${p.numeric_player_id} | Name: ${p.player_name} | Email: ${p.email} | Sport: ${p.sport} | Status: ${p.verification_status}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
