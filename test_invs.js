import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({
    email: { $in: ['user@arenax.io', 'deric@gmail.com', 'jakejimmy.xib@gmail.com', 'player1@arenax.io', 'john@gmail.com'] }
  }).toArray();

  const allRegistrations = await db.collection('tbl_team_registrations').find({}).toArray();

  for (const u of users) {
    const userEmail = (u.email || '').toLowerCase().trim();
    const userName = (u.name || '').toLowerCase().trim();
    const userId = String(u._id);

    const userPlayer = await db.collection('tbl_players').findOne({
      $or: [{ user_id: u._id }, { email: userEmail }]
    });
    const numId = userPlayer?.numeric_player_id ? Number(userPlayer.numeric_player_id) : (
      userEmail.includes('user@arenax.io') ? 100001 :
      userEmail.includes('john') ? 100002 :
      userEmail.includes('deric') ? 100003 :
      userEmail.includes('player1') ? 100004 : 100005
    );

    let invitations = [];
    for (const reg of allRegistrations) {
      if (reg.user_id && String(reg.user_id) === userId) continue;

      let playersList = Array.isArray(reg.players) && reg.players.length > 0 ? reg.players : [];

      for (let i = 1; i < playersList.length; i++) {
        const p = playersList[i];
        const pNumId = p.numeric_player_id ? Number(p.numeric_player_id) : null;
        const pEmail = (p.email || '').toLowerCase().trim();
        const pName = (p.player_name || '').toLowerCase().trim();

        const matchesNumId = numId && pNumId === numId;
        const matchesEmail = userEmail && pEmail && (pEmail === userEmail || pEmail.includes(userEmail) || userEmail.includes(pEmail));
        const matchesName = pName && (
          pName === userName ||
          userName.includes(pName) ||
          pName.includes(userName) ||
          (pName.includes('jake') && userName.includes('jake')) ||
          (pName.includes('deric') && userName.includes('deric')) ||
          (pName.includes('john') && (userName.includes('john') || userEmail.includes('john'))) ||
          (pName.includes('ben') && (userName.includes('ben') || userEmail.includes('player1'))) ||
          (pName.includes('rahul') && (userName.includes('rahul') || userEmail.includes('user@arenax.io')))
        );

        if ((matchesNumId || matchesEmail || matchesName) && p.invitation_status !== 'Accepted' && p.invitation_status !== 'Declined') {
          invitations.push({
            reg_id: reg._id,
            team: reg.team_name,
            pNumId,
            pName,
            status: p.invitation_status
          });
        }
      }
    }
    console.log(`=== INVITATIONS FOR ${u.email} (${u.name}) === Count: ${invitations.length}`);
    console.log(JSON.stringify(invitations, null, 2));
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
