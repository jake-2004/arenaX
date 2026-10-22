import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/arenax');
  const db = mongoose.connection.db;
  const t = await db.collection('tbl_tournaments').findOne({ tournament_name: 'REHAN MEMORIAL FOOTBALL TOURNAMENT' });
  console.log('Tournament:', t?.tournament_name, 'organizer_id:', t?.organizer_id);
  const org = await db.collection('tbl_organizers').findOne({ _id: t?.organizer_id });
  console.log('TblOrganizer:', org);
  if (org) {
    const u = await db.collection('tbl_users').findOne({ _id: org.user_id });
    console.log('TblUser:', u?.email, u?.full_name);
  }
  const allUsers = await db.collection('users').find({ role: 'organizer' }).toArray();
  console.log('Organizers in User collection:');
  allUsers.forEach(u => console.log(u._id.toString(), u.email, u.name, u.organization));
  process.exit(0);
}

run();
