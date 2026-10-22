import mongoose from 'mongoose';
import { TblPlayer, TblTeamRegistration, TblTeam } from '../models/schemaModels.js';

const MONGODB_URI = 'mongodb://localhost:27017/arenax';

async function approveAllPlayers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB database:', MONGODB_URI);

    // 1. Approve all existing pending TblPlayer records
    const updateResult = await TblPlayer.updateMany(
      { verification_status: { $ne: 'Approved' } },
      { $set: { verification_status: 'Approved' } }
    );
    console.log(`✔ Updated ${updateResult.modifiedCount} existing TblPlayer records to "Approved".`);

    // 2. Fetch highest existing numeric_player_id
    const highestPlayer = await TblPlayer.findOne({ numeric_player_id: { $exists: true, $ne: null } })
      .sort({ numeric_player_id: -1 })
      .lean();

    let nextNumericId = 100001;
    if (highestPlayer && highestPlayer.numeric_player_id && !isNaN(highestPlayer.numeric_player_id)) {
      nextNumericId = Math.max(100001, Number(highestPlayer.numeric_player_id) + 1);
    }

    // 3. Find all tournament team registrations
    const registrations = await TblTeamRegistration.find({}).lean();
    console.log(`✔ Found ${registrations.length} team registrations.`);

    let newlyRegisteredCount = 0;

    for (const reg of registrations) {
      const playersList = reg.players || [];
      const sport = reg.sport || 'Sports';

      for (const p of playersList) {
        if (!p.player_name) continue;

        // Check if player already has a TblPlayer record
        let existing = null;
        if (p.numeric_player_id) {
          existing = await TblPlayer.findOne({ numeric_player_id: Number(p.numeric_player_id) });
        }
        if (!existing) {
          existing = await TblPlayer.findOne({ player_name: p.player_name.trim() });
        }

        if (existing) {
          if (existing.verification_status !== 'Approved') {
            existing.verification_status = 'Approved';
            await existing.save();
          }
        } else {
          // Auto-register missing player as Approved with unique numeric Player ID
          const created = await TblPlayer.create({
            user_id: reg.user_id || null,
            numeric_player_id: nextNumericId++,
            player_name: p.player_name.trim(),
            email: `${p.player_name.toLowerCase().replace(/\s+/g, '')}@arenax.com`,
            phone: '9876543210',
            sport: sport,
            position: p.position || 'Player',
            jersey_number: p.jersey_number || '10',
            photo: p.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            id_proof_type: p.id_proof_type || 'Aadhaar Card',
            id_proof_number: p.id_proof_number || `1234 5678 ${Math.floor(1000 + Math.random() * 9000)}`,
            id_proof_doc: p.id_proof_doc || '/uploads/proofs/id_proof-1786987859209-234295114.pdf',
            gender: 'Male',
            verification_status: 'Approved'
          });

          newlyRegisteredCount++;
          console.log(`  + Auto-created Approved Player Profile for "${created.player_name}" -> Player ID #${created.numeric_player_id}`);
        }
      }
    }

    const totalApproved = await TblPlayer.countDocuments({ verification_status: 'Approved' });
    console.log(`\n🎉 Success! Total Approved Players in MongoDB: ${totalApproved} (${newlyRegisteredCount} newly registered).`);

  } catch (error) {
    console.error('Error approving all players:', error);
  } finally {
    await mongoose.disconnect();
  }
}

approveAllPlayers();
