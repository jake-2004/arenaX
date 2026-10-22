import mongoose from 'mongoose';
import { TblTournament, TblOrganizer, TblUser } from '../server/models/schemaModels.js';
import { User } from '../server/models/User.js';

async function testOrg(email) {
  const mainUser = await User.findOne({ email });
  const tblUser = await TblUser.findOne({ email });
  const organizer = tblUser ? await TblOrganizer.findOne({ user_id: tblUser._id }) : null;

  const orgIds = [mainUser?._id, tblUser?._id, organizer?._id].filter(Boolean);

  const tblTournaments = await TblTournament.find({
    $or: [
      { organizer_id: { $in: orgIds } },
      { organizer_name: mainUser?.name },
      { organizer_name: mainUser?.organization }
    ]
  }).sort({ createdAt: -1 });

  console.log(`=== Tournaments for ${email} (found: ${tblTournaments.length}) ===`);
  tblTournaments.forEach(t => console.log(t._id.toString(), '|', t.tournament_name, '| status:', t.status, '| fee_paid:', t.publishing_fee_paid));
}

async function run() {
  await mongoose.connect('mongodb://localhost:27017/arenax');
  await testOrg('jake@gmail.com');
  await testOrg('organizer@arenax.io');
  process.exit(0);
}

run();
