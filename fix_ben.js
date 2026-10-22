import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Update Ben user account
  const benUser = await db.collection('users').findOneAndUpdate(
    { email: 'player1@arenax.io' },
    {
      $set: {
        name: 'Ben',
        numeric_player_id: 100004
      }
    },
    { returnDocument: 'after' }
  );
  console.log('Updated Ben user account:', benUser?.email, benUser?.name);

  // Guarantee master player record in tbl_players
  await db.collection('tbl_players').updateOne(
    { email: 'player1@arenax.io' },
    {
      $set: {
        numeric_player_id: 100004,
        player_name: 'Ben',
        email: 'player1@arenax.io',
        user_id: benUser?._id,
        sport: 'Football',
        position: 'Striker / Forward',
        jersey_number: '10',
        verification_status: 'Approved',
        id_proof_type: 'Aadhaar Card',
        id_proof_number: '123456789012'
      }
    },
    { upsert: true }
  );

  // Add Ben to Deric's latest Kottayam registration (Slot 3)
  const dericUser = await db.collection('users').findOne({ email: 'deric@gmail.com' });
  const dericReg = await db.collection('tbl_team_registrations').findOne({
    user_id: dericUser._id,
    _id: new mongoose.Types.ObjectId('6a84262d39877144ee8172b4')
  });

  if (dericReg && Array.isArray(dericReg.players)) {
    dericReg.players[2] = {
      numeric_player_id: 100004,
      player_name: 'Ben',
      email: 'player1@arenax.io',
      sport: 'Football',
      position: 'Forward / Striker',
      jersey_number: '3',
      id_proof_type: 'Aadhaar Card',
      id_proof_number: '123456789012',
      invitation_status: 'Pending',
      isVerifiedProfile: true
    };

    await db.collection('tbl_team_registrations').updateOne(
      { _id: dericReg._id },
      { $set: { players: dericReg.players } }
    );
    console.log('✅ Added Ben to Deric registration:', dericReg._id);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
