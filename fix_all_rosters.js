import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const rahulPlayer = await db.collection('tbl_players').findOne({ numeric_player_id: 100001 });
  console.log('Rahul Player in DB:', rahulPlayer?.numeric_player_id, rahulPlayer?.player_name, rahulPlayer?.email);

  // Fix all registrations where players array is missing or empty by pulling from tbl_teams
  const regs = await db.collection('tbl_team_registrations').find({}).toArray();
  for (const r of regs) {
    let players = r.players;
    if (!players || players.length === 0) {
      if (r.team_id) {
        const teamDoc = await db.collection('tbl_teams').findOne({ _id: r.team_id });
        if (teamDoc && Array.isArray(teamDoc.players) && teamDoc.players.length > 0) {
          players = teamDoc.players;
        }
      }
    }

    if (Array.isArray(players)) {
      // Ensure any slot named Rahul has numeric_player_id: 100001 and email: user@arenax.io and invitation_status: 'Pending'
      let updated = false;
      players.forEach((p, idx) => {
        if (idx > 0) {
          if (p.player_name && p.player_name.toLowerCase().includes('rahul')) {
            p.numeric_player_id = 100001;
            p.email = 'user@arenax.io';
            p.player_name = 'Rahul';
            p.invitation_status = 'Pending';
            updated = true;
          } else if (p.player_name && p.player_name.toLowerCase().includes('deric')) {
            p.numeric_player_id = 100003;
            p.email = 'deric@gmail.com';
            p.player_name = 'deric';
            p.invitation_status = 'Pending';
            updated = true;
          } else if (p.player_name && p.player_name.toLowerCase().includes('jake')) {
            p.numeric_player_id = 100005;
            p.email = 'jakejimmy.xib@gmail.com';
            p.player_name = 'Jake Jimmy';
            p.invitation_status = 'Pending';
            updated = true;
          }
        }
      });

      await db.collection('tbl_team_registrations').updateOne(
        { _id: r._id },
        { $set: { players: players } }
      );
      if (r.team_id) {
        await db.collection('tbl_teams').updateOne(
          { _id: r.team_id },
          { $set: { players: players } }
        );
      }
    }
  }

  console.log('✅ All registration and team roster records synchronized in MongoDB!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
