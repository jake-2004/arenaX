import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const benUser = await db.collection('users').findOne({ email: 'player1@arenax.io' });
  console.log('BEN USER:', benUser?._id, benUser?.email, benUser?.name);

  const benPlayer = await db.collection('tbl_players').findOne({
    $or: [{ email: 'player1@arenax.io' }, { numeric_player_id: 100004 }, { player_name: /ben/i }]
  });
  console.log('BEN PLAYER IN DB:', benPlayer?.numeric_player_id, benPlayer?.player_name, benPlayer?.email, benPlayer?.user_id);

  const regs = await db.collection('tbl_team_registrations').find({}).toArray();
  let found = [];
  for (let r of regs) {
    let players = r.players || [];
    for (let i = 1; i < players.length; i++) {
      const p = players[i];
      if (Number(p.numeric_player_id) === 100004 || p.email === 'player1@arenax.io' || (p.player_name && p.player_name.toLowerCase().includes('ben'))) {
        found.push({ reg_id: r._id, creator: r.user_id, team: r.team_name, player: p });
      }
    }
  }
  console.log('INVITATIONS SENT TO BEN:\n', JSON.stringify(found, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
