import mongoose from 'mongoose';
import { TblTeamRegistration, TblPlayer, TblTournament, TblPayment, TblUser } from '../server/models/schemaModels.js';

async function testPaymentFlow() {
  await mongoose.connect('mongodb://localhost:27017/arenax');
  console.log('Connected to MongoDB');

  const deric = await TblUser.findOne({ email: 'deric@gmail.com' });
  const jake = await TblPlayer.findOne({ numeric_player_id: 100005 });
  const chessTourn = await TblTournament.findOne({ sport: 'Chess' }) || await TblTournament.findOne({});

  console.log('Deric User ID:', deric?._id);
  console.log('Jake Player ID:', jake?.numeric_player_id, jake?.player_name);
  console.log('Tournament:', chessTourn?.title || chessTourn?.tournament_name);

  // Check recent registration
  const reg = await TblTeamRegistration.findOne({ user_id: deric?._id }).sort({ createdAt: -1 });
  console.log('Deric Registration:', reg ? {
    id: reg._id,
    team_name: reg.team_name,
    payment_status: reg.payment_status,
    registration_status: reg.registration_status,
    players: reg.players?.map(p => ({ name: p.player_name, id: p.numeric_player_id, status: p.invitation_status }))
  } : 'No registration found');

  await mongoose.disconnect();
}

testPaymentFlow();
