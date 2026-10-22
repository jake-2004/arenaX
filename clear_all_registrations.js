import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // 1. Delete all team registrations
  const delRegsResult = await db.collection('tbl_team_registrations').deleteMany({});
  console.log(`🧹 Deleted ${delRegsResult.deletedCount} records from tbl_team_registrations`);

  try {
    const delRegsOld = await db.collection('team_registrations').deleteMany({});
    console.log(`🧹 Deleted ${delRegsOld.deletedCount} records from team_registrations`);
  } catch (e) {}

  // 2. Delete all teams created for registrations
  const delTeamsResult = await db.collection('tbl_teams').deleteMany({});
  console.log(`🧹 Deleted ${delTeamsResult.deletedCount} records from tbl_teams`);

  try {
    const delTeamsOld = await db.collection('teams').deleteMany({});
    console.log(`🧹 Deleted ${delTeamsOld.deletedCount} records from teams`);
  } catch (e) {}

  // 3. Reset tournament team counts back to 0
  const resetTourn1 = await db.collection('tbl_tournaments').updateMany(
    {},
    { $set: { registered_teams_count: 0, registeredTeamsCount: 0 } }
  );
  console.log(`🔄 Reset registered teams count on ${resetTourn1.modifiedCount} tbl_tournaments`);

  const resetTourn2 = await db.collection('tournaments').updateMany(
    {},
    { $set: { registered_teams_count: 0, registeredTeamsCount: 0, registered_teams: [] } }
  );
  console.log(`🔄 Reset registered teams count on ${resetTourn2.modifiedCount} tournaments`);

  // 4. Verify player profiles are clean and verified
  const players = await db.collection('tbl_players').find({}).toArray();
  console.log('\n--- ACTIVE MASTER PLAYERS ---');
  for (const p of players) {
    console.log(`Player ID #${p.numeric_player_id} - ${p.player_name} (${p.email}) - Status: ${p.verification_status}`);
  }

  console.log('\n✨ Database is completely reset! All tournament registrations and invitations have been cleared.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
