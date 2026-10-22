import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const dericUser = await db.collection('users').findOne({ email: 'deric@gmail.com' });
  console.log('Deric User ID:', dericUser?._id);

  // Delete all unapproved duplicates for deric
  await db.collection('tbl_players').deleteMany({
    player_name: { $regex: /deric/i },
    numeric_player_id: { $in: [null, undefined] }
  });

  // Guarantee Deric's master player profile
  await db.collection('tbl_players').updateOne(
    { player_name: { $regex: /deric/i } },
    {
      $set: {
        numeric_player_id: 100003,
        player_name: 'deric',
        email: 'deric@gmail.com',
        user_id: dericUser?._id,
        verification_status: 'Approved',
        id_proof_number: '1234567890'
      }
    },
    { upsert: true }
  );

  // Update existing team records where deric was added by another captain
  const teams = await db.collection('tbl_teams').find({}).toArray();
  for (const t of teams) {
    if (Array.isArray(t.players)) {
      let modified = false;
      t.players.forEach((p, idx) => {
        if (idx > 0 && p.player_name && p.player_name.toLowerCase().includes('deric')) {
          p.numeric_player_id = 100003;
          p.email = 'deric@gmail.com';
          p.invitation_status = 'Pending';
          modified = true;
        }
      });
      if (modified) {
        await db.collection('tbl_teams').updateOne(
          { _id: t._id },
          { $set: { players: t.players } }
        );
        console.log('✅ Updated tbl_teams record for deric:', t._id);
      }
    }
  }

  // Update existing registrations where deric was added
  const regs = await db.collection('tbl_team_registrations').find({}).toArray();
  for (const r of regs) {
    const t = await db.collection('tbl_teams').findOne({ _id: r.team_id });
    if (t && Array.isArray(t.players)) {
      await db.collection('tbl_team_registrations').updateOne(
        { _id: r._id },
        { $set: { players: t.players } }
      );
      console.log('✅ Updated tbl_team_registrations for deric:', r._id);
    }
  }

  const allPlayers = await db.collection('tbl_players').find({}).toArray();
  console.log('--- ALL PLAYERS ---');
  console.log(JSON.stringify(allPlayers.map(p => ({ id: p.numeric_player_id, name: p.player_name, email: p.email, user_id: p.user_id })), null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
