import mongoose from 'mongoose';
import { TblPlayer } from '../models/schemaModels.js';
import { User } from '../models/User.js';

const MONGODB_URI = 'mongodb://localhost:27017/arenax';

async function deduplicatePlayers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB database for player deduplication:', MONGODB_URI);

    const players = await TblPlayer.find({}).sort({ createdAt: 1 }).lean();
    console.log(`Total TblPlayer records before deduplication: ${players.length}`);

    const seenUsers = new Set();
    const seenNames = new Set();
    const idsToRemove = [];

    for (const p of players) {
      const uId = p.user_id ? p.user_id.toString() : null;
      const cleanName = (p.player_name || '').trim().toLowerCase();

      let isDuplicate = false;

      if (uId && seenUsers.has(uId)) {
        isDuplicate = true;
      } else if (cleanName && seenNames.has(cleanName)) {
        isDuplicate = true;
      }

      if (isDuplicate) {
        idsToRemove.push(p._id);
        console.log(`  - Marking duplicate for removal: ID #${p.numeric_player_id || 'N/A'} Name: "${p.player_name}" (_id: ${p._id})`);
      } else {
        if (uId) seenUsers.add(uId);
        if (cleanName) seenNames.add(cleanName);
      }
    }

    if (idsToRemove.length > 0) {
      const delRes = await TblPlayer.deleteMany({ _id: { $in: idsToRemove } });
      console.log(`✔ Successfully removed ${delRes.deletedCount} duplicate player records.`);
    } else {
      console.log('✔ No duplicate player records found.');
    }

    const remainingPlayers = await TblPlayer.find({}).lean();
    console.log('\n=== FINAL UNIQUE VERIFIED PLAYERS IN MONGODB ===');
    console.log(JSON.stringify(remainingPlayers.map(p => ({
      _id: p._id,
      user_id: p.user_id,
      numeric_player_id: p.numeric_player_id,
      name: p.player_name,
      email: p.email,
      sport: p.sport,
      position: p.position,
      status: p.verification_status
    })), null, 2));

  } catch (error) {
    console.error('Error deduplicating players:', error);
  } finally {
    await mongoose.disconnect();
  }
}

deduplicatePlayers();
