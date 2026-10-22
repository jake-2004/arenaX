import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Guarantee John's user account
  const johnUser = await db.collection('users').findOne({ email: 'john@gmail.com' });
  console.log('John User ID:', johnUser?._id);

  // Guarantee master player record for John
  await db.collection('tbl_players').updateOne(
    { email: 'john@gmail.com' },
    {
      $set: {
        numeric_player_id: 100002,
        player_name: 'JOHN',
        email: 'john@gmail.com',
        user_id: johnUser?._id,
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

  // Update all registrations where JOHN is named
  const regs = await db.collection('tbl_team_registrations').find({}).toArray();
  for (const r of regs) {
    if (Array.isArray(r.players)) {
      let modified = false;
      r.players.forEach((p, idx) => {
        if (idx > 0 && p.player_name && p.player_name.toLowerCase().includes('john')) {
          p.numeric_player_id = 100002;
          p.email = 'john@gmail.com';
          p.player_name = 'JOHN';
          p.invitation_status = 'Pending';
          p.isVerifiedProfile = true;
          modified = true;
        }
      });
      if (modified) {
        await db.collection('tbl_team_registrations').updateOne(
          { _id: r._id },
          { $set: { players: r.players } }
        );
        if (r.team_id) {
          await db.collection('tbl_teams').updateOne(
            { _id: r.team_id },
            { $set: { players: r.players } }
          );
        }
        console.log('✅ Updated registration for John:', r._id);
      }
    }
  }

  // Add John to Deric's latest Kottayam tournament registration (Slot 4)
  const dericUser = await db.collection('users').findOne({ email: 'deric@gmail.com' });
  const dericReg = await db.collection('tbl_team_registrations').findOne({
    user_id: dericUser._id,
    _id: new mongoose.Types.ObjectId('6a84262d39877144ee8172b4')
  });

  if (dericReg && Array.isArray(dericReg.players)) {
    dericReg.players[3] = {
      numeric_player_id: 100002,
      player_name: 'JOHN',
      email: 'john@gmail.com',
      sport: 'Football',
      position: 'Midfielder',
      jersey_number: '4',
      id_proof_type: 'Aadhaar Card',
      id_proof_number: '123456789012',
      invitation_status: 'Pending',
      isVerifiedProfile: true
    };

    await db.collection('tbl_team_registrations').updateOne(
      { _id: dericReg._id },
      { $set: { players: dericReg.players } }
    );
    console.log('✅ Added John to Deric registration:', dericReg._id);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
