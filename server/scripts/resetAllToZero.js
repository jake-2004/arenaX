import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/arenax';

async function resetAllToZero() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    await db.collection('tournaments').updateMany({}, { $set: { registeredTeamsCount: 0, currentTeams: 0 } });
    await db.collection('tbl_tournaments').updateMany({}, { $set: { registered_teams_count: 0, current_teams: 0 } });
    await db.collection('tbl_team_registrations').deleteMany({});
    await db.collection('tbl_teams').deleteMany({});
    await db.collection('tbl_matches').deleteMany({});
    await db.collection('tbl_fixtures').deleteMany({});

    const feedList = await db.collection('tournaments').find({}).toArray();
    const tblList = await db.collection('tbl_tournaments').find({}).toArray();

    console.log('=== VERIFICATION OF ALL TOURNAMENTS ===');
    console.log('Feed Tournaments:', feedList.map(t => ({ title: t.title, registeredTeamsCount: t.registeredTeamsCount })));
    console.log('Schema Tournaments:', tblList.map(t => ({ name: t.tournament_name, registered_teams_count: t.registered_teams_count })));

    console.log('\n🎉 ALL TOURNAMENTS SUCCESSFULLY RESET TO 0 REGISTRATIONS!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetAllToZero();
