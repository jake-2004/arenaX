import mongoose from 'mongoose';
import { Tournament } from '../models/Tournament.js';
import { 
  TblTournament, TblTeamRegistration, TblTeam, TblMatch, TblFixture 
} from '../models/schemaModels.js';

const MONGODB_URI = 'mongodb://localhost:27017/arenax';

async function purgeFootball() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for purging Football tournament & team data...');

    // 1. Delete all Football tournaments from tbl_tournaments
    const tblTournDel = await TblTournament.deleteMany({
      $or: [
        { sport: /football/i },
        { tournament_name: /football/i },
        { tournament_name: /kerala premier/i }
      ]
    });
    console.log(`✔ Deleted ${tblTournDel.deletedCount} Football tournament records from "tbl_tournaments".`);

    // 2. Delete all Football tournaments from tournaments feed
    const feedTournDel = await Tournament.deleteMany({
      $or: [
        { sport: /football/i },
        { title: /football/i },
        { title: /kerala premier/i }
      ]
    });
    console.log(`✔ Deleted ${feedTournDel.deletedCount} Football tournament records from "tournaments".`);

    // 3. Delete all Football teams from tbl_teams
    const teamDel = await TblTeam.deleteMany({
      $or: [
        { sport: /football/i },
        { team_name: /fc/i }
      ]
    });
    console.log(`✔ Deleted ${teamDel.deletedCount} Football team records from "tbl_teams".`);

    // 4. Delete team registrations for Football
    const regDel = await TblTeamRegistration.deleteMany({
      $or: [
        { sport: /football/i },
        { tournament_id: '6a83529bdadc3e0d28b80a5b' },
        { tournament_id: new mongoose.Types.ObjectId('6a83529bdadc3e0d28b80a5b') }
      ]
    });
    console.log(`✔ Deleted ${regDel.deletedCount} team registration records from "tbl_team_registrations".`);

    // 5. Delete Football matches & fixtures
    const matchDel = await TblMatch.deleteMany({
      $or: [
        { sport: /football/i },
        { tournament_id: '6a83529bdadc3e0d28b80a5b' },
        { tournament_id: new mongoose.Types.ObjectId('6a83529bdadc3e0d28b80a5b') }
      ]
    });
    console.log(`✔ Deleted ${matchDel.deletedCount} match records from "tbl_matches".`);

    const fixtureDel = await TblFixture.deleteMany({
      $or: [
        { sport: /football/i },
        { tournament_id: '6a83529bdadc3e0d28b80a5b' },
        { tournament_id: new mongoose.Types.ObjectId('6a83529bdadc3e0d28b80a5b') }
      ]
    });
    console.log(`✔ Deleted ${fixtureDel.deletedCount} fixture records from "tbl_fixtures".`);

    console.log('\n🎉 ALL Football tournaments, teams, registrations, and roster details have been completely purged from MongoDB!');

  } catch (error) {
    console.error('Error purging Football data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

purgeFootball();
