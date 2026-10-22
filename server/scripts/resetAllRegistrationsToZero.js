import mongoose from 'mongoose';
import { Tournament } from '../models/Tournament.js';
import { 
  TblTournament, TblTeamRegistration, TblTeam, TblMatch, TblFixture 
} from '../models/schemaModels.js';

const MONGODB_URI = 'mongodb://localhost:27017/arenax';

async function resetAllRegistrationsToZero() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB database for resetting registrations to 0...');

    // 1. Reset registeredTeamsCount to 0 for all Tournament feed documents
    const feedResult = await Tournament.updateMany(
      {},
      { $set: { registeredTeamsCount: 0, currentTeams: 0 } }
    );
    console.log(`✔ Reset registeredTeamsCount = 0 for ${feedResult.modifiedCount} feed tournaments.`);

    // 2. Reset registered_teams_count to 0 for all TblTournament documents
    const tblResult = await TblTournament.updateMany(
      {},
      { $set: { registered_teams_count: 0, current_teams: 0 } }
    );
    console.log(`✔ Reset registered_teams_count = 0 for ${tblResult.modifiedCount} schema tournaments.`);

    // 3. Clear all team registrations from tbl_team_registrations
    const regDel = await TblTeamRegistration.deleteMany({});
    console.log(`✔ Deleted ${regDel.deletedCount} team registration documents from "tbl_team_registrations".`);

    // 4. Clear all teams from tbl_teams
    const teamDel = await TblTeam.deleteMany({});
    console.log(`✔ Deleted ${teamDel.deletedCount} team documents from "tbl_teams".`);

    // 5. Clear matches & fixtures
    const matchDel = await TblMatch.deleteMany({});
    const fixtureDel = await TblFixture.deleteMany({});
    console.log(`✔ Deleted ${matchDel.deletedCount} matches & ${fixtureDel.deletedCount} fixtures.`);

    // Verification summary
    const feedList = await Tournament.find({}).lean();
    const tblList = await TblTournament.find({}).lean();
    const totalRegs = await TblTeamRegistration.countDocuments();
    const totalTeams = await TblTeam.countDocuments();

    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log(`Total Team Registrations in DB: ${totalRegs}`);
    console.log(`Total Teams in DB: ${totalTeams}`);
    console.log('Feed Tournaments:', feedList.map(t => ({ title: t.title, registeredTeamsCount: t.registeredTeamsCount })));
    console.log('Schema Tournaments:', tblList.map(t => ({ name: t.tournament_name, registered_teams_count: t.registered_teams_count })));
    console.log('\n🎉 ALL tournament registrations have been reset to 0!');

  } catch (error) {
    console.error('Error resetting registrations to 0:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetAllRegistrationsToZero();
