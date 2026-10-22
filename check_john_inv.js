import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const johnUser = await db.collection('users').findOne({ email: 'john@gmail.com' });
  console.log('JOHN USER ID:', johnUser._id);

  const userPlayer = await db.collection('tbl_players').findOne({
    $or: [{ user_id: johnUser._id }, { email: 'john@gmail.com' }, { player_name: new RegExp('^john$', 'i') }]
  });
  console.log('JOHN PLAYER:', userPlayer?.numeric_player_id, userPlayer?.player_name, userPlayer?.email);

  const userEmail = (johnUser.email || '').toLowerCase().trim();
  const userName = (johnUser.name || '').toLowerCase().trim();
  const userId = String(johnUser._id);
  const numId = userPlayer?.numeric_player_id ? Number(userPlayer.numeric_player_id) : 100002;

  const allRegistrations = await db.collection('tbl_team_registrations').find({}).toArray();
  const pendingInvitations = [];

  for (const reg of allRegistrations) {
    if (reg.user_id && String(reg.user_id) === userId) continue;

    let playersList = Array.isArray(reg.players) && reg.players.length > 0 ? reg.players : [];

    for (let i = 1; i < playersList.length; i++) {
      const p = playersList[i];
      const pNumId = p.numeric_player_id ? Number(p.numeric_player_id) : null;
      const pEmail = (p.email || '').toLowerCase().trim();
      const pName = (p.player_name || '').toLowerCase().trim();

      // Only match if p.numeric_player_id equals John's numId, or p.email matches, or p.player_name matches John
      const matchesNumId = numId && pNumId && pNumId === numId;
      const matchesEmail = userEmail && pEmail && pEmail === userEmail;
      const matchesName = pName && (
        pName === userName ||
        (userPlayer?.player_name && pName === userPlayer.player_name.toLowerCase()) ||
        (pName === 'john' && (userName === 'john' || userEmail === 'john@gmail.com'))
      );

      if ((matchesNumId || matchesEmail || matchesName) && p.invitation_status !== 'Accepted' && p.invitation_status !== 'Declined') {
        pendingInvitations.push({
          registration_id: reg._id,
          team_name: reg.team_name,
          pNumId,
          pName,
          pEmail,
          invitation_status: p.invitation_status
        });
      }
    }
  }

  console.log('PRECISE INVITATIONS FOR JOHN:\n', JSON.stringify(pendingInvitations, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
