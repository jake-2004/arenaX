import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function updateJakeRegistrations() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const jakeUser = await db.collection('users').findOne({ email: 'jakejimmy.xib@gmail.com' });
  console.log('Jake User ID:', jakeUser?._id);

  // Update existing team records where Jake Jimmy was added by deric
  const teams = await db.collection('tbl_teams').find({}).toArray();
  for (const t of teams) {
    if (Array.isArray(t.players)) {
      let modified = false;
      t.players.forEach((p, idx) => {
        if (idx > 0 && p.player_name && p.player_name.toLowerCase().includes('jake')) {
          p.numeric_player_id = 100005;
          p.email = 'jakejimmy.xib@gmail.com';
          p.invitation_status = 'Pending';
          modified = true;
        }
      });
      if (modified) {
        await db.collection('tbl_teams').updateOne(
          { _id: t._id },
          { $set: { players: t.players } }
        );
        console.log('✅ Updated tbl_teams record for Jake Jimmy:', t._id);
      }
    }
  }

  // Update existing team registration records
  const regs = await db.collection('tbl_team_registrations').find({}).toArray();
  for (const r of regs) {
    const t = await db.collection('tbl_teams').findOne({ _id: r.team_id });
    if (t && Array.isArray(t.players)) {
      await db.collection('tbl_team_registrations').updateOne(
        { _id: r._id },
        { $set: { players: t.players } }
      );
      console.log('✅ Updated tbl_team_registrations players array:', r._id);
    }
  }

  process.exit(0);
}

updateJakeRegistrations().catch(err => {
  console.error(err);
  process.exit(1);
});
